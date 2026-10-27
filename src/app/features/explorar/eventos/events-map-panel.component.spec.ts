import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventsMapPanelComponent } from './events-map-panel.component';
import { EventMapComponent } from '../../../shared/components/event-map/event-map.component';
import { EventMapPoint } from '../../../shared/models/event-map.model';

@Component({ selector: 'app-event-map', standalone: true, template: '' })
class TestMapComponent {
  points = input.required<readonly EventMapPoint[]>();
  label = input('');
}

describe('Mapa general de Explorar', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsMapPanelComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).overrideComponent(EventsMapPanelComponent, {
      remove: { imports: [EventMapComponent] },
      add: { imports: [TestMapComponent] },
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('no consulta ubicaciones hasta que el usuario abre el mapa', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.detectChanges();
    http.expectNone(() => true);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Buscando eventos');
    http.expectOne(req => req.url.endsWith('/events/map'))
      .flush({ content: [], number: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay eventos');
  });

  it('cancela la petición pendiente al cerrar el mapa', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.componentInstance.toggle();
    const request = http.expectOne(req => req.url.endsWith('/events/map'));
    fixture.componentInstance.toggle();
    expect(request.cancelled).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('muestra un error y permite reintentar sin datos ficticios', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.componentInstance.toggle();
    http.expectOne(req => req.url.endsWith('/events/map'))
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar');
    fixture.componentInstance.load();
    http.expectOne(req => req.url.endsWith('/events/map'))
      .flush({ content: [], number: 0, totalPages: 0 });
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('abre automáticamente el mapa al elegir la vista Mapa y cancela al salir', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const request = http.expectOne(req => req.url.endsWith('/events/map'));
    expect(fixture.componentInstance.open()).toBe(true);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });
  it('actualiza los marcadores reales al cambiar y limpiar filtros', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('filters', { cityName: 'Valencia', maxPrice: 20 });
    fixture.detectChanges();
    const point: EventMapPoint = {
      eventId: 7, occurrenceId: 71, title: 'Yoga', priceFrom: 15, currency: 'EUR',
      startsAt: '2099-12-22T12:00:00Z', endsAt: '2099-12-22T13:00:00Z',
      locationName: 'Centro', address: 'Calle 12', cityName: 'Valencia',
      latitude: 39.47, longitude: -0.38, modality: 'PRESENCIAL',
    };
    const barcelona = { ...point, eventId: 8, occurrenceId: 81, cityName: 'Barcelona',
      latitude: 41.39, longitude: 2.17 };
    http.expectOne(req => req.url.endsWith('/events/map'))
      .flush({ content: [point, barcelona], number: 0, totalPages: 1 });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayPoints()).toEqual([point]);
    expect(fixture.componentInstance.eventCount()).toBe(1);
    fixture.componentRef.setInput('filters', { cityName: 'Barcelona' });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayPoints()).toEqual([barcelona]);
    fixture.componentRef.setInput('filters', { maxPrice: 0 });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayPoints()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay sesiones que coincidan');
    fixture.componentRef.setInput('filters', {});
    fixture.detectChanges();
    expect(fixture.componentInstance.displayPoints()).toEqual([point, barcelona]);
    http.expectNone(() => true);
  });

  it('mantiene el mapa vacío cuando el servidor no devuelve ubicaciones', () => {
    const fixture = TestBed.createComponent(EventsMapPanelComponent);
    fixture.componentInstance.toggle();
    http.expectOne(req => req.url.endsWith('/events/map'))
      .flush({ content: [], number: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayPoints()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('latitud y longitud');
    expect(fixture.nativeElement.textContent).not.toContain('Probar');
  });
});