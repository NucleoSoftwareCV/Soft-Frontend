import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { JwtResponse } from '../../shared/models/auth.model';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let accessToken: string;

  const session = signal<JwtResponse | null>({
    token: 'expired-token',
    refreshToken: 'valid-refresh-token',
    type: 'Bearer',
    id: 1,
    username: 'user1',
    email: 'user1@oona.es',
    roles: ['USER'],
  });

  const authService = {
    currentUser: session,
    get token() {
      return accessToken;
    },
    refreshToken: vi.fn(() => {
      accessToken = 'renewed-token';
      return of({
        accessToken: 'renewed-token',
        refreshToken: 'renewed-refresh-token',
        tokenType: 'Bearer',
        roles: ['USER'],
      });
    }),
    logout: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(() => {
    accessToken = 'expired-token';
    authService.refreshToken.mockClear();
    authService.logout.mockClear();
    router.navigate.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('renews the token and retries a protected request after a 401', () => {
    httpClient.get('/api/v1/favorites/ids').subscribe(response => {
      expect(response).toEqual([1, 2]);
    });

    const firstRequest = httpTesting.expectOne('/api/v1/favorites/ids');
    expect(firstRequest.request.headers.get('Authorization'))
      .toBe('Bearer expired-token');
    firstRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retriedRequest = httpTesting.expectOne('/api/v1/favorites/ids');
    expect(retriedRequest.request.headers.get('Authorization'))
      .toBe('Bearer renewed-token');
    retriedRequest.flush([1, 2]);

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('does not attach an expired access token to authentication requests', () => {
    httpClient.post('/api/auth/refresh-token', {
      refreshToken: 'valid-refresh-token',
    }).subscribe();

    const request = httpTesting.expectOne('/api/auth/refresh-token');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({
      accessToken: 'renewed-token',
      refreshToken: 'renewed-refresh-token',
      tokenType: 'Bearer',
      roles: ['USER'],
    });
  });
});
