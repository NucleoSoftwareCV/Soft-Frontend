import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BookingFilters, ProfessionalBookingDetail, ProfessionalBookingPage } from '../shared/models/professional-booking.model';

@Injectable({ providedIn: 'root' })
export class ProfessionalBookingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings/professional/me`;

  list(filters: BookingFilters = {}) {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.eventId) params = params.set('eventId', filters.eventId);
    if (filters.occurrenceId) params = params.set('occurrenceId', filters.occurrenceId);
    return this.http.get<ProfessionalBookingPage>(this.base, { params });
  }

  detail(code: string) {
    return this.http.get<ProfessionalBookingDetail>(`${this.base}/${encodeURIComponent(code)}`);
  }

  decide(code: string, status: 'CONFIRMADA' | 'CANCELADA', reason?: string) {
    return this.http.patch<ProfessionalBookingDetail>(`${this.base}/${encodeURIComponent(code)}/status`, { status, reason });
  }
}
