import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AppointmentRescheduleComponent } from './appointment-reschedule.component';
import { AppointmentOptions, AppointmentReceipt, AppointmentService } from '../../services/appointment.service';

describe('Reprogramación de una cita', () => {
  const current: AppointmentReceipt = {
    id: 8, code: 'CITA-8', serviceId: 5, title: 'Consulta', professionalName: 'Ana', customerName: 'Cliente',
    startsAt: '2026-11-10T14:00:00Z', endsAt: '2026-11-10T15:00:00Z', modality: 'ONLINE', venue: null,
    price: 50, currency: 'PEN', status: 'CONFIRMADA', expiresAt: null, reason: 'Consulta inicial',
  };
  const nextSlot = { startsAt: '2026-11-11T15:00:00Z', endsAt: '2026-11-11T16:00:00Z' };
  const options: AppointmentOptions = {
    serviceId: 5, title: 'Consulta', professionalName: 'Ana', durationMinutes: 60, price: 50, currency: 'PEN',
    modalities: ['ONLINE'], venues: [], timeZone: 'America/Lima', minDate: '2026-11-09', maxDate: '2027-02-07', openings: [],
  };
  let api: { options: ReturnType<typeof vi.fn>; availability: ReturnType<typeof vi.fn>; rescheduleMyAppointment: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = {
      options: vi.fn().mockReturnValue(of(options)),
      availability: vi.fn().mockReturnValue(of({ date: '2026-11-10', timeZone: 'America/Lima', slots: [nextSlot] })),
      rescheduleMyAppointment: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [AppointmentRescheduleComponent],
      providers: [{ provide: AppointmentService, useValue: api }],
    }).compileComponents();
  });

  function fixture() {
    const fixture = TestBed.createComponent(AppointmentRescheduleComponent);
    fixture.componentRef.setInput('appointment', current);
    fixture.detectChanges();
    return fixture;
  }

  it('consulta horarios reales y exige horario y motivo', () => {
    const component = fixture().componentInstance;
    expect(api.options).toHaveBeenCalledWith(5);
    expect(api.availability).toHaveBeenCalledWith(5, '2026-11-10', 'ONLINE', null);
    component.submit();
    expect(api.rescheduleMyAppointment).not.toHaveBeenCalled();
  });

  it('envía el nuevo horario y conserva la cita mediante su identificador', () => {
    const response = new Subject<AppointmentReceipt>();
    api.rescheduleMyAppointment.mockReturnValue(response);
    const component = fixture().componentInstance;
    const emitted = vi.fn();
    component.rescheduled.subscribe(emitted);
    component.selected.set(nextSlot);
    component.reason = ' Necesito asistir más tarde ';
    component.submit();
    component.submit();
    expect(api.rescheduleMyAppointment).toHaveBeenCalledOnce();
    expect(api.rescheduleMyAppointment).toHaveBeenCalledWith(8, {
      modality: 'ONLINE', locationId: null, startsAt: nextSlot.startsAt, reason: 'Necesito asistir más tarde',
    });
    const updated = { ...current, ...nextSlot, status: 'PENDIENTE', rescheduledAt: '2026-11-09T14:00:00Z' };
    response.next(updated);
    expect(emitted).toHaveBeenCalledWith(updated);
  });
});
