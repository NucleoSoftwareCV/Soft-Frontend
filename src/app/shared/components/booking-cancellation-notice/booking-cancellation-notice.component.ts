import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideCircleAlert, LucideX } from '@lucide/angular';
import { Subscription, catchError, of, switchMap, timer } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CheckoutService, MyBooking } from '../../../services/checkout.service';

/** Cada cuánto se revisan las reservas mientras el cliente navega. */
export const CANCELLATION_CHECK_INTERVAL_MS = 60_000;
/** Las cancelaciones más antiguas no se avisan (p. ej. al iniciar sesión tras mucho tiempo). */
const MAX_NOTICE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Avisa al cliente cuando una reserva suya fue rechazada por el profesional o expiró sin pago. */
@Component({
  selector: 'app-booking-cancellation-notice',
  standalone: true,
  imports: [DatePipe, RouterLink, LucideCircleAlert, LucideX],
  templateUrl: './booking-cancellation-notice.component.html',
  styleUrl: './booking-cancellation-notice.component.css',
})
export class BookingCancellationNoticeComponent {
  private readonly auth = inject(AuthService);
  private readonly checkout = inject(CheckoutService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private polling?: Subscription;

  readonly notices = signal<MyBooking[]>([]);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.polling?.unsubscribe();
      this.notices.set([]);
      if (!this.isBrowser || !user?.roles?.includes('USER')) return;
      this.polling = timer(0, CANCELLATION_CHECK_INTERVAL_MS).pipe(
        switchMap(() => this.checkout.getMyBookings().pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(bookings => {
        if (bookings) this.show(bookings, user.id);
      });
    });
  }

  dismiss(): void {
    const user = this.auth.currentUser();
    if (user) this.markSeen(user.id, this.notices().map(b => b.code));
    this.notices.set([]);
  }

  private show(bookings: MyBooking[], userId: number): void {
    const seen = this.readSeen(userId);
    const limit = Date.now() - MAX_NOTICE_AGE_MS;
    const fresh = bookings.filter(b => b.status === 'CANCELADA' && b.cancellationCause
      && !seen.has(b.code) && (!b.cancelledAt || Date.parse(b.cancelledAt) >= limit));
    // Mantiene en pantalla lo que ya se estaba mostrando y añade lo nuevo.
    const shown = new Set(this.notices().map(b => b.code));
    const added = fresh.filter(b => !shown.has(b.code));
    if (added.length) this.notices.update(current => [...current, ...added]);
  }

  private storageKey(userId: number): string {
    return `oona.cancellationNoticesSeen.${userId}`;
  }

  private readSeen(userId: number): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(this.storageKey(userId)) ?? '[]'));
    } catch {
      return new Set();
    }
  }

  private markSeen(userId: number, codes: string[]): void {
    try {
      const seen = this.readSeen(userId);
      codes.forEach(code => seen.add(code));
      localStorage.setItem(this.storageKey(userId), JSON.stringify([...seen]));
    } catch {
      // Sin almacenamiento el aviso volverá a salir en la próxima visita; no es grave.
    }
  }
}
