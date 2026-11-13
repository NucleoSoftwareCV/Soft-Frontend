import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CampaniasService } from '../../services/campanias.service';
import { EventosService } from '../../services/eventos.service';
import { AuthService } from '../../core/services/auth.service';
import { EventoCardComponent } from '../../shared/components/evento-card/evento-card.component';
import { CampaignDetail, CampaignMyEntries } from '../../shared/models/campania.model';
import { EventCardResponse } from '../../shared/models/evento.model';

const ZONE = 'Europe/Madrid';
const PREVIEW_SIZE = 8;

interface KeyDate {
  label: string;
  value: string;
}

@Component({
  selector: 'app-campania-detalle',
  standalone: true,
  imports: [RouterLink, EventoCardComponent],
  templateUrl: './campania-detalle.html',
  styleUrl: './campania-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaniaDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly campaniasService = inject(CampaniasService);
  private readonly eventosService = inject(EventosService);
  private readonly authService = inject(AuthService);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly campaign = signal<CampaignDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);

  readonly eventos = signal<EventCardResponse[]>([]);
  readonly totalEventos = signal(0);
  readonly eventosLoading = signal(false);

  readonly myEntries = signal<CampaignMyEntries | null>(null);
  readonly linkCopied = signal(false);

  readonly summary = computed(() => this.campaign()?.summary ?? null);
  readonly isOpen = computed(() => this.summary()?.phase === 'ABIERTA');
  readonly explorarQuery = computed(() => ({ campania: this.summary()?.slug ?? null }));

  readonly keyDates = computed<KeyDate[]>(() => {
    const detail = this.campaign();
    if (!detail) return [];
    const dates: KeyDate[] = [
      { label: 'Empieza el periodo de participación', value: this.formatDateTime(detail.summary.participationStartsAt) },
      { label: 'Último momento para reservar y participar', value: this.formatDateTime(detail.summary.participationEndsAt) },
    ];
    if (detail.summary.drawAt) {
      dates.push({ label: 'Sorteo entre todas las participaciones válidas', value: this.formatDate(detail.summary.drawAt) });
    }
    if (detail.prizeActivationDeadline) {
      dates.push({ label: 'Fecha límite para activar el premio', value: this.formatDate(detail.prizeActivationDeadline) });
    }
    return dates;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.load(slug);
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  formatPrize(detail: CampaignDetail): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: detail.summary.prizeCurrency || 'EUR',
      maximumFractionDigits: 0,
    }).format(detail.summary.prizeAmount);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: ZONE }).format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ZONE,
    }).format(new Date(value));
  }

  shareUrl(): string {
    return this.isBrowser ? window.location.href : '';
  }

  whatsappShareUrl(detail: CampaignDetail): string {
    const text = `${detail.summary.title} · ${this.formatPrize(detail)} en Oona: ${this.shareUrl()}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  scrollToLegal(): void {
    if (!this.isBrowser) return;
    document.getElementById('bases-legales')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async copyLink(): Promise<void> {
    if (!this.isBrowser || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    } catch {
      this.linkCopied.set(false);
    }
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.error.set(null);
    this.campaign.set(null);
    this.eventos.set([]);
    this.myEntries.set(null);

    this.campaniasService.getBySlug(slug).subscribe({
      next: (detail) => {
        this.campaign.set(detail);
        this.loading.set(false);
        this.title.setTitle(`${detail.summary.title} | Oona`);
        if (detail.summary.phase === 'ABIERTA') this.loadEventos(slug);
        if (this.isLoggedIn) this.loadMyEntries(slug);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('No pudimos cargar la promoción. Inténtalo nuevamente.');
        }
      },
    });
  }

  private loadEventos(slug: string): void {
    this.eventosLoading.set(true);
    this.eventosService
      .getEventos({ campaignSlug: slug, size: PREVIEW_SIZE, sort: 'startsAt,asc' })
      .subscribe({
        next: (page) => {
          this.eventos.set(page.content ?? []);
          this.totalEventos.set(page.totalElements ?? page.content?.length ?? 0);
          this.eventosLoading.set(false);
        },
        error: () => {
          this.eventos.set([]);
          this.eventosLoading.set(false);
        },
      });
  }

  private loadMyEntries(slug: string): void {
    this.campaniasService.getMyEntries(slug).subscribe({
      next: (entries) => this.myEntries.set(entries),
      error: () => this.myEntries.set(null),
    });
  }
}
