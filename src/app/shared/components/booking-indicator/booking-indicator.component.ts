import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MyBookingsStore } from '../../../services/my-bookings.store';
import { bookingIndicator } from '../../utils/booking-status.util';

/** Indica en tarjetas y detalles que el cliente ya tiene una reserva en ese evento. */
@Component({
  selector: 'app-booking-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (indicator(); as current) {
      <span class="booking-indicator" [attr.data-status]="current.status">{{ current.text }}</span>
    }
  `,
  styles: `
    .booking-indicator {
      display: inline-block;
      margin: 4px 0;
      padding: 4px 10px;
      border-radius: 999px;
      background: #e6f1ef;
      color: #005766;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
    }
    .booking-indicator[data-status='ACEPTADA'] { background: #fff1e6; color: #a34a12; }
    .booking-indicator[data-status='PENDIENTE'] { background: #f3f4f6; color: #4b5563; }
  `,
})
export class BookingIndicatorComponent {
  private readonly store = inject(MyBookingsStore);

  readonly eventId = input.required<number>();
  readonly indicator = computed(() => bookingIndicator(this.store.forEvent(this.eventId())));
}
