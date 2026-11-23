import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { BookingStatus } from '../shared/models/professional-booking.model';
import { SpringPage } from '../shared/models/evento.model';

export interface AdminBooking {
  code: string;
  orderCode: string | null;
  orderStatus: string | null;
  customerName: string;
  customerEmail: string;
  professionalName: string;
  eventId: number;
  eventTitle: string;
  occurrenceStartsAt: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentDeadline: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationCause: 'RECHAZADA' | 'EXPIRADA' | 'CLIENTE' | null;
  cancellationReason: string | null;
  createdAt: string;
}

export interface AdminBookingFilters {
  status?: BookingStatus;
  from?: string;
  to?: string;
  page?: number;
}

/** Supervisión de reservas desde el panel de administración (solo lectura). */
@Injectable({ providedIn: 'root' })
export class AdminBookingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/bookings`;

  list(filters: AdminBookingFilters = {}): Observable<SpringPage<AdminBooking>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', 20);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<SpringPage<AdminBooking>>(this.base, { params });
  }
}
