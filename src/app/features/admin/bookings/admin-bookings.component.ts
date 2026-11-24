import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminBooking, AdminBookingsService } from '../../../services/admin-bookings.service';
import { SpringPage } from '../../../shared/models/evento.model';
import { BOOKING_STATUS_LABELS, BookingStatus } from '../../../shared/models/professional-booking.model';

const CANCELLATION_LABELS: Record<string, string> = {
  RECHAZADA: 'Rechazada por el profesional',
  CLIENTE: 'Cancelada por el cliente',
  EXPIRADA: 'Vencida',
};

/** Supervisión de reservas, pagos y cancelaciones. La gestión de cada reserva es del profesional. */
@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.css',
})
export class AdminBookingsComponent implements OnInit {
  private readonly api = inject(AdminBookingsService);

  readonly statusLabels = BOOKING_STATUS_LABELS;
  readonly statuses: BookingStatus[] = ['PENDIENTE', 'ACEPTADA', 'CONFIRMADA', 'CANCELADA'];
  readonly page = signal<SpringPage<AdminBooking> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  status: BookingStatus | '' = '';
  from = '';
  to = '';

  ngOnInit(): void {
    this.load();
  }

  load(page = 0): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({
      page,
      status: this.status || undefined,
      from: this.from ? new Date(`${this.from}T00:00:00`).toISOString() : undefined,
      to: this.to ? new Date(`${this.to}T23:59:59`).toISOString() : undefined,
    }).subscribe({
      next: (result) => {
        this.page.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las reservas.');
        this.loading.set(false);
      },
    });
  }

  cancellationLabel(booking: AdminBooking): string {
    return booking.cancellationCause ? CANCELLATION_LABELS[booking.cancellationCause] : 'Cancelada';
  }
}
