import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription, catchError, of, switchMap, tap, timer } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { AppNotification, NotificationPage } from '../shared/models/notification.model';

/** Cada cuánto se comprueba si hay avisos nuevos. */
export const NOTIFICATIONS_REFRESH_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base = `${environment.apiUrl}/notifications`;
  private polling?: Subscription;

  readonly unreadCount = signal(0);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.polling?.unsubscribe();
      this.unreadCount.set(0);
      if (!this.isBrowser || !user) {
        return;
      }
      this.polling = timer(0, NOTIFICATIONS_REFRESH_MS)
        .pipe(switchMap(() => this.fetchUnread()))
        .subscribe((count) => {
          if (count !== null) {
            this.unreadCount.set(count);
          }
        });
    });
    if (this.isBrowser) {
      window.addEventListener('focus', () => this.refreshUnread());
    }
  }

  list(page = 0, size = 20): Observable<NotificationPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<NotificationPage>(`${this.base}/me`, { params });
  }

  markRead(id: number): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.base}/${id}/read`, {}).pipe(tap(() => this.refreshUnread()));
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/me/read-all`, {}).pipe(tap(() => this.unreadCount.set(0)));
  }

  refreshUnread(): void {
    if (!this.auth.currentUser()) {
      return;
    }
    this.fetchUnread().subscribe((count) => {
      if (count !== null) {
        this.unreadCount.set(count);
      }
    });
  }

  private fetchUnread(): Observable<number | null> {
    return this.http.get<{ count: number }>(`${this.base}/me/unread-count`).pipe(
      switchMap((response) => of(response.count)),
      catchError(() => of(null)),
    );
  }
}
