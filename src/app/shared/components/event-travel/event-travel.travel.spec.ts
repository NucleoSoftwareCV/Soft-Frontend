import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { EventTravelComponent, LocationNoticeComponent } from './event-travel.component';
import { EventTravelService } from '../../../services/event-travel.service';
import { EventTravel } from '../../models/event-travel.model';

describe('Información de desplazamiento', () => {
  const value = signal<EventTravel | undefined>(undefined);
  const location = signal<any>({ label: 'Mi barrio' });
  const watch = vi.fn(() => vi.fn());
  beforeEach(() => {
    value.set(undefined); location.set({ label: 'Mi barrio' }); watch.mockClear();
    TestBed.configureTestingModule({
      imports: [EventTravelComponent, LocationNoticeComponent], providers: [provideRouter([]),
        { provide: EventTravelService, useValue: {
          eligible: signal(true), loaded: signal(true), loadError: signal(false),
          location, result: () => value(), watch,
        } },
      ],
    });
  });
  it('no muestra métricas ni solicita cálculos para eventos online', () => {
    const f = TestBed.createComponent(EventTravelComponent);
    f.componentRef.setInput('occurrenceId', 7); f.componentRef.setInput('modality', 'ONLINE');
    f.detectChanges(); expect(watch).not.toHaveBeenCalled(); expect(f.nativeElement.textContent.trim()).toBe('');
  });
  it('distingue distancia en línea recta y tiempo no disponible', () => {
    const f = TestBed.createComponent(EventTravelComponent);
    f.componentRef.setInput('occurrenceId', 7); f.componentRef.setInput('modality', 'PRESENCIAL');
    value.set({ occurrenceId: 7, status: 'AVAILABLE', distanceKm: 12.4, durationMinutes: null,
      method: 'STRAIGHT_LINE', approximate: true, address: 'Centro', cityName: 'Madrid', directionsUrl: null });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('12,4 km');
    expect(f.nativeElement.textContent).toContain('en línea recta');
    expect(f.nativeElement.querySelector('.travel-compact').title).toContain('Tiempo de viaje no disponible');
    expect(f.nativeElement.querySelector('.travel-compact').title).toContain('Ubicación aproximada');
    expect(f.nativeElement.textContent).not.toContain('Centro');
    expect(f.nativeElement.textContent).not.toContain('Tiempo de viaje no disponible');
  });
  it('presenta la ruta, el tiempo y su aviso cuando el proveedor los entrega', () => {
    const f = TestBed.createComponent(EventTravelComponent);
    f.componentRef.setInput('occurrenceId', 7); f.componentRef.setInput('modality', 'HIBRIDA');
    f.componentRef.setInput('detail', true);
    value.set({ occurrenceId: 7, status: 'AVAILABLE', distanceKm: 14, durationMinutes: 82,
      method: 'ROUTE', approximate: false, address: 'Centro', cityName: 'Madrid',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1' });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('1 h 22 min');
    expect(f.nativeElement.textContent).toContain('sin tráfico en tiempo real');
    expect(f.nativeElement.querySelector('.route').textContent).toContain('Cómo llegar');
  });
  it('muestra kilómetros y tiempo juntos sin dirección larga ni panel de detalle en tarjetas', () => {
    const f = TestBed.createComponent(EventTravelComponent);
    f.componentRef.setInput('occurrenceId', 7); f.componentRef.setInput('modality', 'PRESENCIAL');
    value.set({ occurrenceId: 7, status: 'AVAILABLE', distanceKm: 166, durationMinutes: 110,
      method: 'ROUTE', approximate: true, address: 'Dirección larga de prueba', cityName: 'Valencia', directionsUrl: null });
    f.detectChanges();
    const compact = f.nativeElement.querySelector('.travel-compact');
    expect(compact.textContent).toContain('166,0 km');
    expect(compact.textContent).toContain('1 h 50 min');
    expect(compact.textContent).not.toContain('Dirección larga');
    expect(compact.title).toContain('Dirección larga');
    expect(f.nativeElement.querySelector('h3')).toBeNull();
  });
  it('la notificación enlaza a Preferencias cuando falta origen', () => {
    location.set(null);
    const f = TestBed.createComponent(LocationNoticeComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Añade tu ubicación en Preferencias');
    expect(f.nativeElement.querySelector('a').getAttribute('href')).toBe('/preferencias');
  });
  it('reconecta el cálculo cuando se cambia la sesión seleccionada', () => {
    const f = TestBed.createComponent(EventTravelComponent);
    f.componentRef.setInput('occurrenceId', 7); f.componentRef.setInput('modality', 'PRESENCIAL'); f.detectChanges();
    f.componentRef.setInput('occurrenceId', 8); f.detectChanges();
    expect(watch.mock.calls).toEqual([[7], [8]]);
  });
});
