import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { ClientPreferencesService } from './client-preferences.service';

describe('ClientPreferencesService', () => {
  let service: ClientPreferencesService;
  let http: HttpTestingController;
  const endpoint = `${environment.apiUrl}/client-profiles/me/preferences`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientPreferencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the authenticated client preferences', () => {
    service.getPreferences().subscribe();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('updates communications and interests without changing the resource', () => {
    const payload = {
      firstName: 'Ana',
      lastName: 'Lopez',
      cityId: 2,
      communicationEmail: 'ana@example.com',
      whatsappPhone: null,
      receiveSavedEventConfirmations: true,
      receivePersonalizedRecommendations: true,
      receiveReservationConfirmations: true,
      receiveWeeklySummary: false,
      categoryIds: [1, 3],
    };
    service.savePreferences(payload).subscribe();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });
});
