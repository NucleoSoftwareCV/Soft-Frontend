import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { ProfessionalFollowService } from './professional-follow.service';

describe('ProfessionalFollowService', () => {
  let service: ProfessionalFollowService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/professional-follows`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfessionalFollowService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('follows a professional with the protected PUT endpoint', () => {
    service.follow(8).subscribe(response => expect(response.following).toBe(true));

    const request = http.expectOne(`${baseUrl}/8`);
    expect(request.request.method).toBe('PUT');
    request.flush({ professionalId: 8, following: true });
  });

  it('requests five followed professionals ordered by most recent', () => {
    service.getFollowedProfessionals(1, 5).subscribe();

    const request = http.expectOne(req => req.url === baseUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('sort')).toBe('followedAt,desc');
    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 1,
      first: false,
      last: true,
      empty: true,
    });
  });
});
