import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type AppointmentModality = 'ONLINE' | 'PRESENCIAL';
export interface AppointmentVenue { id: number; name: string; address: string; }
export interface AppointmentOpening {
  dayOfWeek: number; startTime: string; endTime: string; validFrom: string; validUntil: string | null; locationId: number | null;
  breakMinutes: number; virtualUrl: string | null;
}
export interface AppointmentOptions {
  serviceId: number; title: string; professionalName: string; durationMinutes: number;
  price: number; currency: string; modalities: AppointmentModality[]; venues: AppointmentVenue[];
  timeZone: string; minDate: string; maxDate: string; openings?: AppointmentOpening[];
}
export interface AppointmentSlot { startsAt: string; endsAt: string; }
export interface AppointmentAvailability { date: string; timeZone: string; slots: AppointmentSlot[]; }
export interface AppointmentRequest { serviceId: number; modality: AppointmentModality; locationId: number | null; startsAt: string; reason: string; }
export interface AppointmentReceipt extends AppointmentSlot {
  id: number; code: string; serviceId: number; title: string; professionalName: string; customerName: string;
  modality: AppointmentModality; venue: AppointmentVenue | null; price: number; currency: string;
  status: string; expiresAt: string | null; reason: string;
  cancelledAt?: string | null; cancellationReason?: string | null;
  cancelledBy?: 'CLIENTE' | 'PROFESIONAL' | null;
  rescheduledAt?: string | null; previousStartsAt?: string | null; previousEndsAt?: string | null;
  rescheduleReason?: string | null;
  rescheduledBy?: 'CLIENTE' | 'PROFESIONAL' | null;
  virtualUrl?: string | null;
}
export interface AppointmentReschedule {
  modality: AppointmentModality; locationId: number | null; startsAt: string; reason: string;
}
export interface AvailabilityRuleInput {
  dayOfWeek: number; startTime: string; endTime: string; validFrom: string; validUntil: string | null; locationId: number | null;
  breakMinutes: number; virtualUrl: string | null;
}
export interface AvailabilityRule extends Omit<AvailabilityRuleInput, 'locationId'> { id: number; venue: AppointmentVenue | null; }
export interface AppointmentBlock { id: number; startsAt: string; endsAt: string; reason: string; }
export interface AppointmentSummary { total: number; pending: number; confirmed: number; completed: number; proposed: number; nextAppointment: AppointmentReceipt | null; }
export interface ProfessionalContact {
  key: string; source: 'CLIENTE' | 'MANUAL'; id: number; customerId: number | null; displayName: string;
  email: string | null; phone: string | null; notes: string | null; appointmentCount: number;
  lastAppointment: string | null; nextAppointment: string | null;
}
export interface ProfessionalContactDetail { contact: ProfessionalContact; history: AppointmentReceipt[]; }
export const peruToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const appointmentDate = (value: string) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  options(id: number) { return this.http.get<AppointmentOptions>(`${this.base}/appointments/services/${id}`); }
  availability(id: number, date: string, modality: AppointmentModality, locationId: number | null) {
    let params = new HttpParams().set('date', date).set('modality', modality);
    if (locationId !== null) params = params.set('locationId', locationId);
    return this.http.get<AppointmentAvailability>(`${this.base}/appointments/services/${id}/availability`, { params });
  }
  request(input: AppointmentRequest) { return this.http.post<AppointmentReceipt>(`${this.base}/appointments/requests`, input); }
  myAppointments() {
    return this.http.get<AppointmentReceipt[]>(`${this.base}/appointments/requests/me`);
  }
  cancelMyAppointment(id: number, reason: string) {
    return this.http.patch<AppointmentReceipt>(`${this.base}/appointments/requests/${id}/cancel`, { reason });
  }
  rescheduleMyAppointment(id: number, input: AppointmentReschedule) {
    return this.http.patch<AppointmentReceipt>(`${this.base}/appointments/requests/${id}/reschedule`, input);
  }
  respondProposal(id: number, accepted: boolean, reason?: string) {
    return this.http.patch<AppointmentReceipt>(`${this.base}/appointments/requests/${id}/proposal`, { accepted, reason: reason || null });
  }
  rules() { return this.http.get<AvailabilityRule[]>(`${this.base}/professional-agenda/availability`); }
  addRule(input: AvailabilityRuleInput) { return this.http.post<AvailabilityRule>(`${this.base}/professional-agenda/availability`, input); }
  removeRule(id: number) { return this.http.delete<void>(`${this.base}/professional-agenda/availability/${id}`); }
  blocks() { return this.http.get<AppointmentBlock[]>(`${this.base}/professional-agenda/blocks`); }
  addBlock(input: { startsAt: string; endsAt: string; reason: string }) { return this.http.post<AppointmentBlock>(`${this.base}/professional-agenda/blocks`, input); }
  removeBlock(id: number) { return this.http.delete<void>(`${this.base}/professional-agenda/blocks/${id}`); }
  summary() { return this.http.get<AppointmentSummary>(`${this.base}/professional-agenda/summary`); }
  agenda(date: string) { return this.http.get<AppointmentReceipt[]>(`${this.base}/professional-agenda/requests`, { params: { date } }); }
  agendaRange(from: string, to: string) {
    return this.http.get<AppointmentReceipt[]>(`${this.base}/professional-agenda/requests/range`, { params: { from, to } });
  }
  pending() {
    return this.http.get<AppointmentReceipt[]>(`${this.base}/professional-agenda/requests/pending`);
  }
  decide(id: number, status: 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA', reason?: string) {
    return this.http.patch<AppointmentReceipt>(`${this.base}/professional-agenda/requests/${id}`, { status, reason: reason || null });
  }
  proposeReschedule(id: number, input: AppointmentReschedule) {
    return this.http.patch<AppointmentReceipt>(`${this.base}/professional-agenda/requests/${id}/reschedule`, input);
  }
  contacts() { return this.http.get<ProfessionalContact[]>(`${this.base}/professional-agenda/contacts`); }
  addContact(input: { displayName: string; email: string | null; phone: string | null; notes: string | null }) {
    return this.http.post<ProfessionalContact>(`${this.base}/professional-agenda/contacts`, input);
  }
  bookContact(customerId: number, input: AppointmentRequest) {
    return this.http.post<AppointmentReceipt>(`${this.base}/professional-agenda/contacts/${customerId}/appointments`, input);
  }
  contact(key: string) { return this.http.get<ProfessionalContactDetail>(`${this.base}/professional-agenda/contacts/${key}`); }
  removeContact(id: number) { return this.http.delete<void>(`${this.base}/professional-agenda/contacts/${id}`); }
}
