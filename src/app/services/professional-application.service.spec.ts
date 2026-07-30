import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { environment } from '../../environments/environment';
import { ProfessionalApplicationService } from './professional-application.service';
import {
  ProfessionalApplicationRequest,
  ProfessionalApplicationResponse,
} from '../shared/models/professional-application.model';

describe('ProfessionalApplicationService', () => {
  let service: ProfessionalApplicationService;
  let http: HttpTestingController;

  const response: ProfessionalApplicationResponse = {
    id: 1,
    userId: 2,
    fullName: 'Ana Gomez',
    email: 'ana@oona.es',
    cityId: 3,
    cityName: 'Valencia',
    professionalType: 'YOGA',
    whatsappPhone: '+34600123456',
    motivation: 'Experiencia en yoga.',
    status: 'PENDIENTE',
    evaluatedById: null,
    evaluatedAt: null,
    rejectionReason: null,
    createdAt: '2026-07-27T00:00:00Z',
    updatedAt: '2026-07-27T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfessionalApplicationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProfessionalApplicationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates or updates the authenticated user application', () => {
    const request: ProfessionalApplicationRequest = {
      fullName: 'Ana Gomez',
      cityId: 3,
      professionalType: 'YOGA',
      whatsappPhone: '+34600123456',
      motivation: 'Experiencia en yoga.',
      privacyAccepted: true,
    };

    service.saveMine(request).subscribe(value => expect(value).toEqual(response));

    const pending = http.expectOne(
      `${environment.apiUrl}/professional-applications/me`
    );
    expect(pending.request.method).toBe('PUT');
    expect(pending.request.body).toEqual(request);
    pending.flush(response);
  });

  it('loads pending applications with pagination for admin', () => {
    service.getForAdmin('PENDIENTE', 1, 10).subscribe();

    const pending = http.expectOne(request =>
      request.url === `${environment.apiUrl}/admin/professional-applications`
    );
    expect(pending.request.method).toBe('GET');
    expect(pending.request.params.get('status')).toBe('PENDIENTE');
    expect(pending.request.params.get('page')).toBe('1');
    expect(pending.request.params.get('size')).toBe('10');
    pending.flush({
      content: [response],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });
  });
});
