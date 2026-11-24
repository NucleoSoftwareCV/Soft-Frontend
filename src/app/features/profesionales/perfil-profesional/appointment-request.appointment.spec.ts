import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePeru from '@angular/common/locales/es-PE';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AppointmentRequestComponent } from './appointment-request.component';
import { AppointmentService, AppointmentAvailability, AppointmentOptions, AppointmentReceipt } from '../../../services/appointment.service';

registerLocaleData(localePeru);
describe('Solicitud de cita con disponibilidad real', () => {
  const slot = { startsAt: '2026-11-09T14:00:00Z', endsAt: '2026-11-09T15:00:00Z' };
  const options: AppointmentOptions = { serviceId: 5, title: 'Consulta', professionalName: 'Ana', durationMinutes: 60, price: 50, currency: 'PEN', modalities: ['ONLINE', 'PRESENCIAL'], venues: [{ id: 7, name: 'Sede de Lima', address: 'Dirección de prueba' }], timeZone: 'America/Lima', minDate: '2026-11-09', maxDate: '2027-01-30' };
  let api: { options: ReturnType<typeof vi.fn>; availability: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-05T12:00:00Z').getTime());
    api = { options: vi.fn().mockReturnValue(of(options)), availability: vi.fn().mockReturnValue(of({ date: options.minDate, timeZone: options.timeZone, slots: [slot] })), request: vi.fn() };
    await TestBed.configureTestingModule({ imports: [AppointmentRequestComponent], providers: [{ provide: AppointmentService, useValue: api }] }).compileComponents();
  });
  afterEach(() => vi.restoreAllMocks());
  function fixture() { const f = TestBed.createComponent(AppointmentRequestComponent); f.componentRef.setInput('serviceId', 5); f.detectChanges(); return f; }
  it('muestra solamente los horarios devueltos por el backend en hora peruana', () => {
    const f = fixture(); expect(api.options).toHaveBeenCalledWith(5);
    expect(f.nativeElement.textContent).toContain('09:00'); expect(f.nativeElement.textContent).toContain('10:00');
    expect(f.componentInstance.slots()).toEqual([slot]); expect(f.componentInstance.selected()).toBeNull();
  });
  it('empieza en el día y modalidad configurados aunque hoy no tenga atención', () => {
    api.options.mockReturnValue(of({ ...options, openings: [{ dayOfWeek: 5, startTime: '09:00:00', endTime: '12:00:00', validFrom: '2026-11-09', validUntil: null, locationId: 7 }] }));
    const c = fixture().componentInstance;
    expect(c.modality).toBe('PRESENCIAL'); expect(c.date).toBe('2026-11-13');
    expect(api.availability).toHaveBeenCalledWith(5, '2026-11-13', 'PRESENCIAL', 7);
    expect(c.scheduleSummary()).toContain('Viernes 09:00–12:00');
  });
  it('distingue la ausencia de configuración sin invitar a probar fechas indefinidamente', () => {
    api.options.mockReturnValue(of({ ...options, openings: [] })); const f = fixture();
    expect(api.availability).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('aún no tiene horarios configurados');
    expect(f.nativeElement.textContent).not.toContain('Prueba otra fecha');
  });
  it('al cambiar de modalidad borra el horario y consulta la sede correcta', () => {
    const c = fixture().componentInstance; c.selected.set(slot); c.reason = 'Motivo'; c.review(); c.changeModality('PRESENCIAL');
    expect(c.selected()).toBeNull(); expect(c.reviewing()).toBe(false); expect(api.availability).toHaveBeenLastCalledWith(5, options.minDate, 'PRESENCIAL', 7);
    c.changeModality('ONLINE'); expect(api.availability).toHaveBeenLastCalledWith(5, options.minDate, 'ONLINE', null);
  });
  it('descarta una respuesta antigua al cambiar de fecha', () => {
    const old = new Subject<AppointmentAvailability>(); const current = new Subject<AppointmentAvailability>();
    api.availability.mockReturnValueOnce(old).mockReturnValueOnce(current);
    const c = fixture().componentInstance; c.date = '2026-11-10'; c.loadSlots();
    old.next({ date: options.minDate, timeZone: options.timeZone, slots: [slot] }); expect(c.slots()).toEqual([]);
    current.next({ date: c.date, timeZone: options.timeZone, slots: [] }); expect(c.loadingSlots()).toBe(false); expect(c.slots()).toEqual([]);
  });
  it('no envía una solicitud sin seleccionar horario y motivo', () => {
    const c = fixture().componentInstance; c.review(); c.submit(); expect(api.request).not.toHaveBeenCalled();
    c.selected.set(slot); c.review(); c.submit(); expect(api.request).not.toHaveBeenCalled();
  });
  it('impide doble envío y presenta el código pendiente, sin anunciar una cita confirmada', () => {
    const result = new Subject<AppointmentReceipt>(); api.request.mockReturnValue(result);
    const f = fixture(); const c = f.componentInstance; c.selected.set(slot); c.reason = '  Quiero relajarme  '; c.review(); c.submit(); c.submit();
    expect(api.request).toHaveBeenCalledOnce(); expect(api.request).toHaveBeenCalledWith({ serviceId: 5, modality: 'ONLINE', locationId: null, startsAt: slot.startsAt, reason: 'Quiero relajarme' });
    result.next({ ...slot, id: 1, code: 'CITA-PRUEBA', serviceId: 5, title: 'Consulta', professionalName: 'Ana', customerName: 'Cliente', modality: 'ONLINE', venue: null, price: 50, currency: 'PEN', status: 'PENDIENTE', expiresAt: null, reason: c.reason }); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('CITA-PRUEBA'); expect(f.nativeElement.textContent).toContain('Pendiente de aceptación'); expect(c.saving()).toBe(false);
  });
  it('si otro usuario ocupa el horario avisa y vuelve a consultar disponibilidad', () => {
    api.request.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Horario ocupado.' } })));
    const c = fixture().componentInstance; c.selected.set(slot); c.reason = 'Motivo'; c.review(); c.submit();
    expect(c.error()).toBe('Horario ocupado.'); expect(c.selected()).toBeNull(); expect(c.reviewing()).toBe(false); expect(api.availability).toHaveBeenCalledTimes(2);
  });
  it('no inventa horarios cuando el profesional no tiene disponibilidad', () => {
    api.availability.mockReturnValue(of({ slots: [] })); const f = fixture(); expect(f.componentInstance.slots()).toEqual([]);
    expect(f.nativeElement.textContent).toContain('No hay horarios disponibles');
  });
  it('explica si la sesión caducó en lugar de mostrar disponibilidad inexistente', () => {
    api.options.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const f = fixture(); expect(f.nativeElement.textContent).toContain('Tu sesión ha caducado'); expect(api.availability).not.toHaveBeenCalled();
  });
});
