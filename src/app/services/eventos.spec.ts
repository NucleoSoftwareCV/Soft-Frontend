import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EventosService } from './eventos.service';
import { EventModality } from '../shared/models/evento.model';

describe('EventosService', () => {
  let service: EventosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EventosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests public events with optional filters', () => {
    service.getEventos({
      categoryId: 2,
      cityName: 'Valencia',
      modality: EventModality.PRESENCIAL,
      dateFrom: '2026-06-26',
      dateTo: '2026-06-27',
      hourFrom: 6,
      hourTo: 12,
      isRecurring: true,
    }).subscribe();

    const req = http.expectOne(request =>
      request.url.endsWith('/events') &&
      request.params.get('categoryId') === '2' &&
      request.params.get('cityName') === 'Valencia' &&
      request.params.get('modality') === 'PRESENCIAL' &&
      request.params.get('dateFrom') === '2026-06-26' &&
      request.params.get('dateTo') === '2026-06-27' &&
      request.params.get('hourFrom') === '6' &&
      request.params.get('hourTo') === '12' &&
      request.params.get('isRecurring') === 'true'
    );

    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, number: 0, size: 12 });
  });

  it('requests a public event detail by id', () => {
    service.getEvento(42).subscribe();

    const req = http.expectOne(request => request.url.endsWith('/events/42'));

    expect(req.request.method).toBe('GET');
    req.flush({ id: 42, title: 'Yoga' });
  });
});
