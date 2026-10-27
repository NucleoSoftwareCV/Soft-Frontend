import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { EventMapService } from './event-map.service';
import { EventMapPoint } from '../shared/models/event-map.model';

export const mapPoint: EventMapPoint = {
  eventId: 7, occurrenceId: 20, title: 'Yoga',
  priceFrom: 15, currency: 'EUR',
  startsAt: '2026-12-22T12:00:00Z', endsAt: '2026-12-22T13:00:00Z',
  locationName: 'Centro', address: 'Calle 12', cityName: 'Valencia',
  latitude: 39.4699, longitude: -0.3763,
};

describe('EventMapService', () => {
  let api: EventMapService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(EventMapService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('carga todas las páginas del mapa, no solo la página visible del catálogo', () => {
    let result: EventMapPoint[] | undefined;
    api.getAllPoints().subscribe(points => result = points);
    const first = http.expectOne(req => req.url === environment.apiUrl + '/events/map' &&
      req.params.get('page') === '0' && req.params.get('size') === '100');
    first.flush({ content: [mapPoint], number: 0, totalPages: 2 });
    expect(result).toBeUndefined();
    const second = http.expectOne(req => req.params.get('page') === '1');
    second.flush({ content: [{ ...mapPoint, eventId: 8, occurrenceId: 21 }], number: 1, totalPages: 2 });
    expect(result?.map(point => point.eventId)).toEqual([7, 8]);
  });

  it('devuelve un mapa vacío sin solicitar páginas adicionales', () => {
    let result: EventMapPoint[] | undefined;
    api.getAllPoints().subscribe(points => result = points);
    http.expectOne(req => req.params.get('page') === '0')
      .flush({ content: [], number: 0, totalPages: 0 });
    expect(result).toEqual([]);
  });

  it('propaga errores de páginas posteriores sin presentar datos parciales como completos', () => {
    let result: EventMapPoint[] | undefined;
    let failed = false;
    api.getAllPoints().subscribe({
      next: points => result = points,
      error: () => failed = true,
    });
    http.expectOne(req => req.params.get('page') === '0')
      .flush({ content: [mapPoint], number: 0, totalPages: 2 });
    http.expectOne(req => req.params.get('page') === '1')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
    expect(result).toBeUndefined();
  });

  it('permite cancelar la carga al cerrar el mapa', () => {
    const subscription = api.getAllPoints().subscribe();
    const request = http.expectOne(req => req.params.get('page') === '0');
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
  });
});
