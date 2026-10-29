import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { ProfessionalBookingsService } from './professional-bookings.service';

describe('ProfessionalBookingsService', () => {
  let service: ProfessionalBookingsService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/bookings/professional/me`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfessionalBookingsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('queries scoped bookings with typed filters and pagination', () => {
    service.list({ page: 1, size: 20, status: 'PENDIENTE', eventId: 3, occurrenceId: 4 }).subscribe();
    const request = http.expectOne(r => r.url === base);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('PENDIENTE');
    expect(request.request.params.get('eventId')).toBe('3');
    expect(request.request.params.get('occurrenceId')).toBe('4');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.has('professionalId')).toBe(false);
    request.flush({ content: [] });
  });
  it('omits optional filters', () => {
    service.list().subscribe();
    const request = http.expectOne(r => r.url === base);
    expect(request.request.params.keys().sort()).toEqual(['page', 'size']);
    request.flush({ content: [] });
  });
  it('retrieves the detail by encoded booking code', () => {
    service.detail('BKG/1').subscribe();
    http.expectOne(base + '/BKG%2F1').flush({});
  });
  it('sends a rejection with its reason', () => {
    service.decide('BKG-1', 'CANCELADA', 'Sin disponibilidad').subscribe();
    const request = http.expectOne(base + '/BKG-1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'CANCELADA', reason: 'Sin disponibilidad' });
    request.flush({});
  });
});
