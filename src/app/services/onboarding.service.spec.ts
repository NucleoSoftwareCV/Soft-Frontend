import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { OnboardingService } from './onboarding.service';
import { EventModality } from '../shared/models/evento.model';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/client-profiles/me/onboarding`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('saves interests through the protected onboarding resource', () => {
    service.saveInterests([1, 2]).subscribe();

    const request = http.expectOne(`${base}/interests`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ categoryIds: [1, 2] });
    request.flush({ status: 'INTERESTS_SAVED', categoryIds: [1, 2], cityId: null, experienceTypeIds: [], modality: null });
  });

  it('persists optional preferences', () => {
    service.savePreferences({ cityId: 3, experienceTypeIds: [4], modality: EventModality.ONLINE }).subscribe();

    const request = http.expectOne(`${base}/preferences`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ cityId: 3, experienceTypeIds: [4], modality: 'ONLINE' });
    request.flush({ status: 'COMPLETED', categoryIds: [], cityId: 3, experienceTypeIds: [4], modality: 'ONLINE' });
  });
});
