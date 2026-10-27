import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { EventMapComponent } from './event-map.component';
import { EventMapPoint } from '../../models/event-map.model';

describe('Mapa interactivo', () => {
  it('inicializa Leaflet en el navegador y agrupa sesiones en la misma ubicación', async () => {
    await TestBed.configureTestingModule({
      imports: [EventMapComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventMapComponent);
    const point: EventMapPoint = {
      eventId: 1, occurrenceId: 1, title: '<img src=x onerror=alert(1)>',
      priceFrom: 10, currency: 'EUR',
      startsAt: '2026-12-22T12:00:00Z', endsAt: '2026-12-22T13:00:00Z',
      locationName: 'Centro', address: 'Calle 12', cityName: 'Valencia',
      latitude: 0, longitude: 0,
    };
    fixture.componentRef.setInput('points', [point, { ...point, eventId: 2, occurrenceId: 2 }]);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.ready()).toBe(true));
    const marker = fixture.nativeElement.querySelector('.oona-map-marker');
    expect(marker).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.oona-map-marker').length).toBe(1);
    marker.click();
    expect(fixture.nativeElement.querySelector('.oona-map-popup strong').textContent).toBe(point.title);
    expect(fixture.nativeElement.querySelector('.oona-map-popup img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.oona-map-popup a').getAttribute('href'))
      .toBe('/evento/1?occurrenceId=1');
    expect(fixture.componentInstance.error()).toBeNull();
    fixture.componentRef.setInput('points', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.oona-map-marker').length).toBe(0);
    fixture.destroy();
  });
  it('permite reencuadrar, activar el zoom con rueda y ampliar sin perder eventos', async () => {
    await TestBed.configureTestingModule({
      imports: [EventMapComponent], providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventMapComponent);
    fixture.componentRef.setInput('points', [{
      eventId: 7, occurrenceId: 71, title: 'Yoga', priceFrom: 15, currency: 'EUR',
      startsAt: '2099-12-22T12:00:00Z', endsAt: '2099-12-22T13:00:00Z',
      locationName: 'Centro', address: 'Ubicación aproximada en Valencia',
      cityName: 'Valencia', latitude: 39.474, longitude: -0.38,
    }]);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.ready()).toBe(true));
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const map = Reflect.get(component, 'map') as import('leaflet').Map;
    const fit = vi.spyOn(map, 'fitBounds');
    fixture.nativeElement.querySelector('[title="Ver todos los eventos"]').click();
    expect(fit).toHaveBeenCalledWith(expect.anything(), { padding: [48, 48], maxZoom: 12 });
    component.toggleWheel();
    expect(map.scrollWheelZoom.enabled()).toBe(true);
    component.toggleWheel();
    expect(map.scrollWheelZoom.enabled()).toBe(false);
    fixture.nativeElement.querySelector('[title="Ampliar mapa"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.map-frame--expanded')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(component.expanded()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.oona-map-marker')).toHaveLength(1);
    fixture.destroy();
  });

  it.each([false, true])('abre rutas solo para sedes exactas (aproximada: %s)', async approximate => {
    await TestBed.configureTestingModule({
      imports: [EventMapComponent], providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventMapComponent);
    fixture.componentRef.setInput('points', [{
      eventId: 7, occurrenceId: 71, title: 'Yoga', priceFrom: 15, currency: 'EUR',
      startsAt: '2099-12-22T12:00:00Z', endsAt: '2099-12-22T13:00:00Z',
      locationName: 'Centro', address: approximate ? 'Ubicación aproximada en Valencia' : 'Calle 12',
      cityName: 'Valencia', latitude: 39.474, longitude: -0.38,
    }]);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.ready()).toBe(true));
    fixture.nativeElement.querySelector('.oona-map-marker').click();
    const link = fixture.nativeElement.querySelector('.oona-map-external') as HTMLAnchorElement;
    expect(link.href).toContain(approximate ? '/maps/search/' : '/maps/dir/');
    expect(link.textContent).toContain(approximate ? 'zona aproximada' : 'Cómo llegar');
    expect(link.rel).toBe('noopener noreferrer');
    expect(link.target).toBe('_blank');
    fixture.destroy();
  });

  it('solicita ubicación solo al pulsar el control y permite continuar si se deniega', async () => {
    await TestBed.configureTestingModule({
      imports: [EventMapComponent], providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventMapComponent);
    fixture.componentRef.setInput('points', []);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.ready()).toBe(true));
    fixture.detectChanges();
    const map = Reflect.get(fixture.componentInstance, 'map') as import('leaflet').Map;
    const locate = vi.spyOn(map, 'locate').mockReturnValue(map);
    const previous = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {} });
    try {
      expect(locate).not.toHaveBeenCalled();
      fixture.nativeElement.querySelector('[title="Centrar en mi ubicación"]').click();
      fixture.detectChanges();
      expect(locate).toHaveBeenCalledOnce();
      expect(fixture.componentInstance.locating()).toBe(true);
      map.fire('locationerror', { code: 1, message: 'denied' });
      fixture.detectChanges();
      expect(fixture.componentInstance.locating()).toBe(false);
      expect(fixture.nativeElement.textContent).toContain('Permite el acceso');
      expect(fixture.componentInstance.error()).toBeNull();
    } finally {
      if (previous) Object.defineProperty(navigator, 'geolocation', previous);
      else Reflect.deleteProperty(navigator, 'geolocation');
      fixture.destroy();
    }
  });
});