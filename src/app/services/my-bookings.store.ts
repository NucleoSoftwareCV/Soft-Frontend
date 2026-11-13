import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription, catchError, of, switchMap, timer } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { CheckoutService, MyBooking } from './checkout.service';

/** Cada cuánto se sincronizan las reservas mientras el cliente navega. */
export const MY_BOOKINGS_REFRESH_MS = 60_000;

const ACTIVE_STATUSES = ['PENDIENTE', 'ACEPTADA', 'CONFIRMADA'];

/** Reservas del cliente para mostrar su estado en Explorar, Inicio y el detalle del evento. */
@Injectable({ providedIn: 'root' })
export class MyBookingsStore {
  private readonly auth = inject(AuthService);
  private readonly checkout = inject(CheckoutService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private polling?: Subscription;

  readonly bookings = signal<MyBooking[]>([]);
  /** Reservas vigentes: las de fechas pasadas ya no condicionan nada. */
  readonly active = computed(() => this.bookings().filter(
    (b) => ACTIVE_STATUSES.includes(b.status) && Date.parse(b.occurrenceStartsAt) > Date.now(),
  ));

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.polling?.unsubscribe();
      this.bookings.set([]);
      if (!this.isBrowser || !user?.roles?.includes('USER')) {
        return;
      }
      this.polling = timer(0, MY_BOOKINGS_REFRESH_MS).pipe(
        switchMap(() => this.checkout.getMyBookings().pipe(catchError(() => of(null)))),
      ).subscribe((bookings) => {
        if (bookings) {
          this.bookings.set(bookings);
        }
      });
    });
    if (this.isBrowser) {
      window.addEventListener('focus', () => this.refresh());
    }
  }

  refresh(): void {
    if (!this.auth.currentUser()?.roles?.includes('USER')) {
      return;
    }
    this.checkout.getMyBookings().pipe(catchError(() => of(null))).subscribe((bookings) => {
      if (bookings) {
        this.bookings.set(bookings);
      }
    });
  }

  forEvent(eventId: number): MyBooking[] {
    return this.active().filter((b) => b.eventId === eventId);
  }

  forOccurrence(occurrenceId: number): MyBooking | null {
    return this.active().find((b) => b.occurrenceId === occurrenceId) ?? null;
  }
}
