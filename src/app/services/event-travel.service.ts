import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subscription, tap } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';
import { EventTravel, ReferenceLocation } from '../shared/models/event-travel.model';

@Injectable({ providedIn: 'root' })
export class EventTravelService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base = environment.apiUrl + '/client-profiles/me';
  private readonly account = computed(() => {
    const user = this.auth.currentUser();
    return this.browser && user?.roles.some(r => r === 'USER' || r === 'ROLE_USER') ? user.id : null;
  });
  private readonly owner = signal<number | null>(null);
  private generation = 0;
  private pending = new Subscription();
  private timer?: ReturnType<typeof setTimeout>;
  private readonly watches = new Map<number, number>();
  private readonly inflight = new Set<number>();
  private readonly routeRetries = new Map<number, { attempt: number; nextAt: number | null }>();
  private readonly retryDelays = [2000, 5000];
  private readonly data = signal<Record<number, EventTravel>>({});
  private readonly saved = signal<ReferenceLocation | null>(null);
  private readonly fetched = signal(false);
  private readonly failure = signal(false);
  readonly eligible = computed(() => this.account() !== null);
  readonly location = computed(() => this.account() === this.owner() ? this.saved() : null);
  readonly loaded = computed(() => this.account() === this.owner() && this.fetched());
  readonly loadError = computed(() => this.account() === this.owner() && this.failure());

  constructor() {
    inject(DestroyRef).onDestroy(() => { clearTimeout(this.timer); this.pending.unsubscribe(); });
    effect(() => {
      const account = this.account();
      untracked(() => this.activate(account));
    });
  }
  private activate(account: number | null): void {
    if (this.owner() === account && (this.fetched() || !account)) return;
    this.owner.set(account);
    this.generation++;
    this.pending.unsubscribe();
    this.pending = new Subscription();
    clearTimeout(this.timer);
    this.inflight.clear();
    this.routeRetries.clear();
    this.data.set({});
    this.saved.set(null);
    this.fetched.set(false);
    this.failure.set(false);
    if (account === null) return;
    const version = this.generation;
    this.pending.add(this.http.get<ReferenceLocation | null>(this.base + '/reference-location').subscribe({
      next: location => {
        if (version !== this.generation) return;
        this.saved.set(location);
        this.fetched.set(true);
        this.schedule();
      },
      error: () => {
        if (version !== this.generation) return;
        this.failure.set(true);
        this.fetched.set(true);
      },
    }));
  }
  retry(): void { this.fetched.set(false); this.activate(this.account()); }
  save(location: ReferenceLocation): Observable<ReferenceLocation> {
    const account = this.account();
    const generation = this.generation;
    return this.http.put<ReferenceLocation>(this.base + '/reference-location', location).pipe(tap(saved => {
      if (account !== this.account() || generation !== this.generation) return;
      this.replace(saved);
    }));
  }
  clear(): Observable<void> {
    const account = this.account();
    const generation = this.generation;
    return this.http.delete<void>(this.base + '/reference-location').pipe(tap(() => {
      if (account === this.account() && generation === this.generation) this.replace(null);
    }));
  }
  private replace(location: ReferenceLocation | null): void {
    this.generation++;
    this.pending.unsubscribe();
    this.pending = new Subscription();
    this.inflight.clear();
    this.routeRetries.clear();
    this.data.set({});
    this.saved.set(location);
    this.fetched.set(true);
    this.failure.set(false);
    this.schedule();
  }
  watch(id: number): () => void {
    this.watches.set(id, (this.watches.get(id) ?? 0) + 1);
    this.schedule();
    return () => {
      const count = (this.watches.get(id) ?? 1) - 1;
      if (count) this.watches.set(id, count); else this.watches.delete(id);
      this.schedule();
    };
  }
  result(id: number | null | undefined): EventTravel | undefined {
    return this.account() === this.owner() && id ? this.data()[id] : undefined;
  }
  retryTravel(id: number | null | undefined): void {
    if (!id || !this.location() || !this.watches.has(id) || this.inflight.has(id) ||
        this.routeRetries.get(id)?.nextAt != null) return;
    this.routeRetries.set(id, { attempt: 0, nextAt: Date.now() + 1000 });
    this.schedule();
  }
  private deferRetry(id: number): void {
    const attempt = this.routeRetries.get(id)?.attempt ?? 0;
    this.routeRetries.set(id, {
      attempt: attempt + 1,
      nextAt: attempt < this.retryDelays.length ? Date.now() + this.retryDelays[attempt] : null,
    });
  }
  private schedule(): void {
    clearTimeout(this.timer);
    if (!this.location() || !this.eligible()) return;
    const waits = [...this.watches.keys()].filter(id => !this.inflight.has(id)).flatMap(id => {
      if (!this.data()[id]) return [40];
      const nextAt = this.routeRetries.get(id)?.nextAt;
      return nextAt == null ? [] : [Math.max(40, nextAt - Date.now())];
    });
    if (waits.length) this.timer = setTimeout(() => this.flush(), Math.min(...waits));
  }
  private flush(): void {
    if (!this.location() || !this.eligible()) return;
    const ids = [...this.watches.keys()].filter(id => {
      const nextAt = this.routeRetries.get(id)?.nextAt;
      return !this.inflight.has(id) && (!this.data()[id] || (nextAt != null && nextAt <= Date.now()));
    }).slice(0, 50);
    if (!ids.length) { this.schedule(); return; }
    ids.forEach(id => this.inflight.add(id));
    const version = this.generation;
    const unavailable = (id: number): EventTravel => ({
      occurrenceId: id, status: 'UNAVAILABLE', distanceKm: null, durationMinutes: null,
      method: null, approximate: false, address: null, cityName: null, directionsUrl: null,
    });
    this.pending.add(this.http.post<EventTravel[]>(this.base + '/event-travel', { occurrenceIds: ids }).subscribe({
      next: rows => {
        if (version !== this.generation) return;
        const values = ids.map(id => rows.find(row => row.occurrenceId === id) ?? unavailable(id));
        this.data.update(current => ({ ...current, ...Object.fromEntries(values.map(row => [row.occurrenceId, row])) }));
        for (const row of values) {
          if (row.status === 'AVAILABLE' && row.method === 'STRAIGHT_LINE' && row.durationMinutes === null)
            this.deferRetry(row.occurrenceId);
          else this.routeRetries.delete(row.occurrenceId);
        }
        ids.forEach(id => this.inflight.delete(id));
        this.schedule();
      },
      error: (error: { status: number }) => {
        if (version !== this.generation) return;
        this.data.update(current => ({ ...current, ...Object.fromEntries(ids.map(id => [id, current[id] ?? unavailable(id)])) }));
        for (const id of ids) {
          if (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500) this.deferRetry(id);
          else this.routeRetries.delete(id);
        }
        ids.forEach(id => this.inflight.delete(id));
        this.schedule();
      },
    }));
  }
}
