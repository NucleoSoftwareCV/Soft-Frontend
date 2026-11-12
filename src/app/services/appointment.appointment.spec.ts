import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { environment } from '../../environments/environment';

describe('API de citas individuales', () => {
  let api: AppointmentService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(AppointmentService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta fecha y modalidad sin mandar una sede para videollamada', () => {
    api.availability(5, '2026-11-09', 'ONLINE', null).subscribe();
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/appointments/services/5/availability`);
    expect(req.request.params.get('date')).toBe('2026-11-09'); expect(req.request.params.get('modality')).toBe('ONLINE'); expect(req.request.params.has('locationId')).toBe(false); req.flush({ slots: [] });
  });
  it('consulta la sede elegida para una sesión presencial', () => {
    api.availability(5, '2026-11-09', 'PRESENCIAL', 7).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/availability')); expect(req.request.params.get('locationId')).toBe('7'); req.flush({ slots: [] });
  });
  it('envía solo los datos de la solicitud, sin fijar cliente, precio ni estado', () => {
    const input = { serviceId: 5, modality: 'ONLINE' as const, locationId: null, startsAt: '2026-11-09T14:00:00Z', reason: 'Bienestar' };
    api.request(input).subscribe(); const req = http.expectOne(`${environment.apiUrl}/appointments/requests`);
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual(input); req.flush({});
  });
  it('gestiona franjas y solicitudes usando únicamente la agenda del usuario autenticado', () => {
    api.rules().subscribe(); http.expectOne(`${environment.apiUrl}/professional-agenda/availability`).flush([]);
    api.agenda('2026-11-09').subscribe(); const req = http.expectOne(r => r.url.endsWith('/professional-agenda/requests'));
    expect(req.request.params.get('date')).toBe('2026-11-09'); req.flush([]);
    api.decide(7, 'CONFIRMADA').subscribe(); const decision = http.expectOne(`${environment.apiUrl}/professional-agenda/requests/7`); expect(decision.request.method).toBe('PATCH'); expect(decision.request.body).toEqual({ status: 'CONFIRMADA', reason: null }); decision.flush({});
    api.cancelMyAppointment(8, 'Cambio de planes').subscribe(); const cancellation = http.expectOne(`${environment.apiUrl}/appointments/requests/8/cancel`); expect(cancellation.request.method).toBe('PATCH'); expect(cancellation.request.body).toEqual({ reason: 'Cambio de planes' }); cancellation.flush({});
    const reschedule = { modality: 'ONLINE' as const, locationId: null, startsAt: '2026-11-09T15:00:00Z', reason: 'Necesito otro horario' };
    api.rescheduleMyAppointment(8, reschedule).subscribe(); const movement = http.expectOne(`${environment.apiUrl}/appointments/requests/8/reschedule`); expect(movement.request.method).toBe('PATCH'); expect(movement.request.body).toEqual(reschedule); movement.flush({});
  });
  it('reserva una cita confirmada desde un contacto real', () => {
    const input = { serviceId: 5, modality: 'ONLINE' as const, locationId: null, startsAt: '2026-11-09T14:00:00Z', reason: 'Seguimiento' };
    api.bookContact(21, input).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/professional-agenda/contacts/21/appointments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ status: 'CONFIRMADA' });
  });
});
