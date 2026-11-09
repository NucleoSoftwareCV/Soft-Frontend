import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProfessionalAgendaComponent } from './professional-agenda.component';
import { AppointmentService, AppointmentReceipt } from '../../../services/appointment.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';

describe('Configuración y revisión de la agenda profesional', () => {
  let api: { rules: ReturnType<typeof vi.fn>; agenda: ReturnType<typeof vi.fn>; pending: ReturnType<typeof vi.fn>; agendaRange: ReturnType<typeof vi.fn>; addRule: ReturnType<typeof vi.fn>; removeRule: ReturnType<typeof vi.fn>; decide: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    api = { rules: vi.fn().mockReturnValue(of([])), agenda: vi.fn().mockReturnValue(of([])), pending: vi.fn().mockReturnValue(of([])), agendaRange: vi.fn().mockReturnValue(of([])), addRule: vi.fn().mockReturnValue(of({})), removeRule: vi.fn().mockReturnValue(of({})), decide: vi.fn().mockReturnValue(of({})) };
    await TestBed.configureTestingModule({ imports: [ProfessionalAgendaComponent], providers: [
      { provide: AppointmentService, useValue: api }, { provide: OneToOneServicesService, useValue: { getActiveLocations: () => of([]) } },
    ] }).compileComponents();
  });
  it('guarda el día y las horas indicados con videollamada sin inventar una sede', () => {
    const f = TestBed.createComponent(ProfessionalAgendaComponent); f.detectChanges(); const c = f.componentInstance;
    c.day = 3; c.start = '10:00'; c.end = '13:00'; c.validFrom = '2026-11-09'; c.validUntil = ''; c.saveRule();
    expect(api.addRule).toHaveBeenCalledWith({ dayOfWeek: 3, startTime: '10:00', endTime: '13:00', validFrom: '2026-11-09', validUntil: null, locationId: null });
    expect(api.rules).toHaveBeenCalledTimes(2); expect(c.message()).toBe('Disponibilidad guardada.');
  });
  it('consulta la nueva fecha sin permitir que una respuesta antigua cambie el día mostrado', () => {
    const old = new Subject<AppointmentReceipt[]>(); const current = new Subject<AppointmentReceipt[]>(); api.agenda.mockReturnValueOnce(old).mockReturnValueOnce(current);
    const f = TestBed.createComponent(ProfessionalAgendaComponent); const c = f.componentInstance;
    c.view.set('day'); f.detectChanges(); c.selectDate('2026-11-10'); old.next([]); expect(c.loading()).toBe(true); current.next([]); expect(c.loading()).toBe(false);
  });
  it('carga pendientes al entrar y usa periodos completos en semana y mes', () => {
    const fixture = TestBed.createComponent(ProfessionalAgendaComponent);
    const component = fixture.componentInstance;
    component.agendaDate.set('2026-11-10');
    fixture.detectChanges();

    expect(api.pending).toHaveBeenCalledOnce();
    component.setView('week');
    expect(api.agendaRange).toHaveBeenLastCalledWith('2026-11-09', '2026-11-15');
    component.setView('month');
    expect(api.agendaRange).toHaveBeenLastCalledWith('2026-11-01', '2026-11-30');
    component.selectDate('2026-11-10', true);
    expect(api.agenda).toHaveBeenLastCalledWith('2026-11-10');
  });
  it('acepta una solicitud real y recarga la agenda; conserva el error del backend si falla', () => {
    const c = TestBed.createComponent(ProfessionalAgendaComponent).componentInstance; c.view.set('day'); c.agendaDate.set('2026-11-09'); c.decide(7, 'CONFIRMADA');
    expect(api.decide).toHaveBeenCalledWith(7, 'CONFIRMADA', undefined); expect(api.agenda).toHaveBeenCalledWith('2026-11-09');
    api.decide.mockReturnValue(throwError(() => ({ error: { detail: 'La solicitud ha vencido.' } }))); c.decide(7, 'CONFIRMADA');
    expect(c.error()).toBe('La solicitud ha vencido.'); expect(c.saving()).toBe(false);
  });
  it('sends the professional cancellation reason and releases the action state', () => {
    const c = TestBed.createComponent(ProfessionalAgendaComponent).componentInstance;
    c.appointmentToCancel.set({ id: 9, code: 'CITA-9', serviceId: 1, title: 'Sesión', professionalName: 'Pro', customerName: 'Cliente', startsAt: '2026-11-15T14:00:00Z', endsAt: '2026-11-15T15:00:00Z', modality: 'ONLINE', venue: null, price: 30, currency: 'PEN', status: 'CONFIRMADA', expiresAt: null, reason: 'Bienestar' });
    c.confirmCancellation('Viaje imprevisto');
    expect(api.decide).toHaveBeenCalledWith(9, 'CANCELADA', 'Viaje imprevisto');
    expect(c.appointmentToCancel()).toBeNull();
  });
});
