import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import { EventosService } from './eventos.service';

describe('EventosService: recomendaciones', () => {
  let service: EventosService;
  let http: HttpTestingController;

  const endpoint = `${environment.apiUrl}/recommendations/events`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EventosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta recomendaciones con la paginación predeterminada', () => {
    service.getRecommendedEventos().subscribe((response) => {
      expect(response.content).toEqual([]);
      expect(response.totalElements).toBe(0);
      expect(response.number).toBe(0);
      expect(response.size).toBe(12);
    });

    const request = http.expectOne(
      (req) =>
        req.url === endpoint && req.params.get('page') === '0' && req.params.get('size') === '12',
    );

    expect(request.request.method).toBe('GET');

    expect(request.request.params.keys().sort()).toEqual(['page', 'size']);

    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 12,
      number: 0,
    });
  });

  it('envía la página y el tamaño solicitados sin añadir sort', () => {
    service.getRecommendedEventos(1, 5).subscribe((response) => {
      expect(response.number).toBe(1);
      expect(response.size).toBe(5);
      expect(response.totalElements).toBe(8);
    });

    const request = http.expectOne(
      (req) =>
        req.url === endpoint && req.params.get('page') === '1' && req.params.get('size') === '5',
    );

    expect(request.request.params.has('sort')).toBe(false);
    expect(request.request.params.has('username')).toBe(false);
    expect(request.request.params.has('userId')).toBe(false);

    request.flush({
      content: [],
      totalElements: 8,
      totalPages: 2,
      size: 5,
      number: 1,
    });
  });

  it('propaga los errores HTTP para que la pantalla pueda manejarlos', () => {
    let receivedError: HttpErrorResponse | undefined;

    service.getRecommendedEventos().subscribe({
      next: () => {
        throw new Error('La petición debería devolver un error');
      },
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = http.expectOne((req) => req.url === endpoint);

    request.flush(
      { detail: 'No autenticado' },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(receivedError?.status).toBe(401);
  });
});
