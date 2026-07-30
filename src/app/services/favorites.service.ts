import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  FavoriteEntityType,
  FavoriteResponse,
} from '../shared/models/favorites.model';
import { AuthService } from '../core/services/auth.service';

interface EventFavoriteApiResponse {
  id: number;
  eventId: number;
  title: string;
  summary: string;
  categoryName: string;
  modality: string;
  eventType: string;
  priceFrom: number;
  currency: string;
  savedAt: string;
}

interface EventFavoriteStatusApiResponse {
  eventId: number;
  favorite: boolean;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly eventFavoritesUrl =
    `${environment.apiUrl}/interactions/me/event-favorites`;

  readonly favoritedEventIds = signal<Set<number>>(new Set());
  readonly favoritedServiceIds = signal<Set<number>>(new Set());
  readonly favoritedProfessionalIds = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadFavoriteIds();
      } else {
        this.clearFavorites();
      }
    });
  }

  loadFavoriteIds(): void {
    if (!this.authService.isLoggedIn) return;

    this.getFavoriteEvents().subscribe({
      next: favorites => {
        this.favoritedEventIds.set(
          new Set(favorites.map(favorite => favorite.eventId))
        );
      },
      error: error => {
        console.error('Error al cargar eventos favoritos', error);
      },
    });
  }

  toggleFavorite(
    entityType: FavoriteEntityType,
    entityId: number
  ): Observable<{ favorited: boolean }> {
    if (entityType !== 'EVENTO') {
      return throwError(
        () => new Error('El backend actual solo admite favoritos de eventos.')
      );
    }

    const isFavorite = this.favoritedEventIds().has(entityId);
    const request = isFavorite
      ? this.http.delete<EventFavoriteStatusApiResponse>(
          `${this.eventFavoritesUrl}/${entityId}`
        )
      : this.http.put<EventFavoriteStatusApiResponse>(
          `${this.eventFavoritesUrl}/${entityId}`,
          {}
        );

    return request.pipe(
      map(response => ({ favorited: response.favorite })),
      tap(response => {
        this.favoritedEventIds.update(current => {
          const next = new Set(current);
          response.favorited ? next.add(entityId) : next.delete(entityId);
          return next;
        });
      })
    );
  }

  getFavorites(): Observable<FavoriteResponse[]> {
    return this.getFavoriteEvents().pipe(
      map(favorites =>
        favorites.map(favorite => ({
          entityType: 'EVENTO' as const,
          entityId: favorite.eventId,
          title: favorite.title,
          categoryName: favorite.categoryName,
          price: favorite.priceFrom,
          currency: favorite.currency,
        }))
      )
    );
  }

  private getFavoriteEvents(): Observable<EventFavoriteApiResponse[]> {
    return this.http.get<EventFavoriteApiResponse[]>(this.eventFavoritesUrl);
  }

  private clearFavorites(): void {
    this.favoritedEventIds.set(new Set());
    this.favoritedServiceIds.set(new Set());
    this.favoritedProfessionalIds.set(new Set());
  }
}
