import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/interactions/me/event-favorites`;
  const currentUser = signal(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser,
            isLoggedIn: true,
          },
        },
      ],
    });
    service = TestBed.inject(FavoritesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('saves an event using the current interaction endpoint', () => {
    service.toggleFavorite('EVENTO', 8).subscribe(response => {
      expect(response.favorited).toBe(true);
    });

    const request = http.expectOne(`${baseUrl}/8`);
    expect(request.request.method).toBe('PUT');
    request.flush({ eventId: 8, favorite: true });
  });

  it('maps the backend event list to profile favorite cards', () => {
    service.getFavorites().subscribe(favorites => {
      expect(favorites[0]).toMatchObject({
        entityType: 'EVENTO',
        entityId: 8,
        title: 'Yoga',
        price: 20,
      });
    });

    const request = http.expectOne(baseUrl);
    request.flush([{
      id: 1,
      eventId: 8,
      title: 'Yoga',
      summary: 'Clase',
      categoryName: 'Yoga',
      modality: 'PRESENCIAL',
      eventType: 'CLASE',
      priceFrom: 20,
      currency: 'EUR',
      savedAt: '2026-07-30T00:00:00Z',
    }]);
  });
});
