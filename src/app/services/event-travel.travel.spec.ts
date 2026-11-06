import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { EventTravelService } from './event-travel.service';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';
import { JwtResponse } from '../shared/models/auth.model';
import { EventTravel, ReferenceLocation } from '../shared/models/event-travel.model';

const origin: ReferenceLocation = { label: 'Mi barrio', latitude: 40, longitude: -3, approximate: true };
const row: EventTravel = { occurrenceId: 7, status: 'AVAILABLE', distanceKm: 12, durationMinutes: null,
  method: 'STRAIGHT_LINE', approximate: true, address: 'Centro', cityName: 'Valencia', directionsUrl: null };
const base = environment.apiUrl + '/client-profiles/me';
const user = (id: number) => ({ id, roles: ['USER'] }) as JwtResponse;

describe('Ubicación privada y trayectos', () => {
  let service: EventTravelService;
  let http: HttpTestingController;
  const account = signal<JwtResponse | null>(null);
  beforeEach(() => {
    vi.useFakeTimers();
    account.set(user(1));
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { currentUser: account } },
    ] });
    service = TestBed.inject(EventTravelService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => {
    http.verify({ ignoreCancelled: true });
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  function load(value: ReferenceLocation | null = origin) {
    http.expectOne(base + '/reference-location').flush(value);
    TestBed.tick();
  }
  function advance() { vi.advanceTimersByTime(45); TestBed.tick(); }

  it('agrupa varias tarjetas y no repite la consulta de una sesión', () => {
    load(); const stop = service.watch(7); service.watch(8); service.watch(7); advance();
    const request = http.expectOne(base + '/event-travel');
    expect(request.request.body.occurrenceIds).toEqual([7, 8]);
    request.flush([row, { ...row, occurrenceId: 8 }]);
    advance();
    expect(service.result(7)?.distanceKm).toBe(12);
    http.expectNone(base + '/event-travel'); stop();
  });
  it('sin referencia no solicita rutas y permite añadirla después', () => {
    load(null); service.watch(7); advance(); http.expectNone(base + '/event-travel');
    service.save(origin).subscribe();
    http.expectOne(base + '/reference-location').flush(origin); advance();
    http.expectOne(base + '/event-travel').flush([row]);
    expect(service.result(7)?.distanceKm).toBe(12);
  });
  it('cambiar el origen cancela cálculos anteriores y solicita datos nuevos', () => {
    load(); service.watch(7); advance();
    const old = http.expectOne(base + '/event-travel');
    service.save({ ...origin, latitude: 39 }).subscribe();
    http.expectOne(base + '/reference-location').flush({ ...origin, latitude: 39 });
    expect(old.cancelled).toBe(true);
    expect(service.result(7)).toBeUndefined();
    advance();
    http.expectOne(base + '/event-travel').flush([{ ...row, distanceKm: 2 }]);
    expect(service.result(7)?.distanceKm).toBe(2);
  });
  it('eliminar la ubicación borra métricas y detiene las consultas', () => {
    load(); service.watch(7); advance(); http.expectOne(base + '/event-travel').flush([row]);
    service.clear().subscribe(); http.expectOne(base + '/reference-location').flush(null);
    advance(); expect(service.location()).toBeNull(); expect(service.result(7)).toBeUndefined();
    http.expectNone(base + '/event-travel');
  });
  it('no muestra origen ni distancias de otra cuenta ni después de salir', () => {
    load(); service.watch(7); advance(); http.expectOne(base + '/event-travel').flush([row]);
    account.set(user(2));
    expect(service.location()).toBeNull(); expect(service.result(7)).toBeUndefined();
    TestBed.tick(); http.expectOne(base + '/reference-location').flush(null);
    account.set(null); TestBed.tick(); advance();
    expect(service.eligible()).toBe(false); expect(service.location()).toBeNull();
    http.expectNone(base + '/event-travel');
  });
  it('no acepta una respuesta de guardado de una sesión anterior', () => {
    load(); service.save(origin).subscribe();
    const oldSave = http.expectOne(base + '/reference-location');
    account.set(null); TestBed.tick(); account.set(user(1)); TestBed.tick();
    http.expectOne(base + '/reference-location').flush(null);
    oldSave.flush(origin);
    expect(service.location()).toBeNull();
  });
  it('actualiza carga y origen aunque la pantalla los lea antes de activar la cuenta', () => {
    load();
    account.set(user(2));
    expect(service.loaded()).toBe(false);
    expect(service.location()).toBeNull();
    TestBed.tick();
    http.expectOne(base + '/reference-location').flush({ ...origin, label: 'Otra cuenta' });
    expect(service.loaded()).toBe(true);
    expect(service.location()?.label).toBe('Otra cuenta');
  });
  it('un error al recuperar ubicación permite reintentar', () => {
    http.expectOne(base + '/reference-location').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.loadError()).toBe(true);
    service.retry(); http.expectOne(base + '/reference-location').flush(origin);
    expect(service.loadError()).toBe(false); expect(service.location()?.label).toBe('Mi barrio');
  });
  it('recupera el tiempo tras un resultado temporal en línea recta sin borrar la distancia', () => {
    load(); service.watch(7); advance();
    http.expectOne(base + '/event-travel').flush([row]);
    vi.advanceTimersByTime(1990); http.expectNone(base + '/event-travel');
    vi.advanceTimersByTime(20);
    const retry = http.expectOne(base + '/event-travel');
    expect(service.result(7)?.distanceKm).toBe(12);
    retry.flush([{ ...row, method: 'ROUTE', distanceKm: 15, durationMinutes: 25 }]);
    vi.advanceTimersByTime(20000);
    expect(service.result(7)?.durationMinutes).toBe(25);
    http.expectNone(base + '/event-travel');
  });
  it('hace como máximo dos reintentos automáticos y permite uno manual después', () => {
    load(); service.watch(7); advance();
    http.expectOne(base + '/event-travel').flush([row]);
    vi.advanceTimersByTime(2001); http.expectOne(base + '/event-travel').flush([row]);
    vi.advanceTimersByTime(5001); http.expectOne(base + '/event-travel').flush([row]);
    vi.advanceTimersByTime(60000); http.expectNone(base + '/event-travel');
    service.retryTravel(7); service.retryTravel(7);
    vi.advanceTimersByTime(1001);
    http.expectOne(base + '/event-travel').flush([{ ...row, method: 'ROUTE', durationMinutes: 10 }]);
    expect(service.result(7)?.durationMinutes).toBe(10);
  });
  it('recupera errores HTTP temporales y no reintenta errores de autenticación', () => {
    load(); service.watch(7); advance();
    http.expectOne(base + '/event-travel').flush({}, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(2001);
    http.expectOne(base + '/event-travel').flush({}, { status: 401, statusText: 'Unauthorized' });
    vi.advanceTimersByTime(60000); http.expectNone(base + '/event-travel');
  });
  it('no insiste en sesiones sin sede válida y cancela al dejar de mostrarlas', () => {
    load(); const stop = service.watch(7); service.watch(8); advance();
    http.expectOne(base + '/event-travel').flush([row, { ...row, occurrenceId: 8, status: 'UNAVAILABLE' }]);
    stop(); vi.advanceTimersByTime(10000); http.expectNone(base + '/event-travel');
  });
  it('cancela los reintentos al eliminar la ubicación o cerrar sesión', () => {
    load(); service.watch(7); advance(); http.expectOne(base + '/event-travel').flush([row]);
    service.clear().subscribe(); http.expectOne(base + '/reference-location').flush(null);
    vi.advanceTimersByTime(10000); http.expectNone(base + '/event-travel');
    service.save(origin).subscribe(); http.expectOne(base + '/reference-location').flush(origin);
    advance(); http.expectOne(base + '/event-travel').flush([row]);
    account.set(null); TestBed.tick();
    vi.advanceTimersByTime(10000); http.expectNone(base + '/event-travel');
    expect(service.result(7)).toBeUndefined();
  });
  it('limita cada lote a 50 sesiones y continúa con las restantes', () => {
    load(); for (let id = 1; id <= 51; id++) service.watch(id);
    advance(); const first = http.expectOne(base + '/event-travel');
    expect(first.request.body.occurrenceIds.length).toBe(50);
    first.flush([]); advance();
    const second = http.expectOne(base + '/event-travel');
    expect(second.request.body.occurrenceIds).toEqual([51]); second.flush([]);
  });
});
