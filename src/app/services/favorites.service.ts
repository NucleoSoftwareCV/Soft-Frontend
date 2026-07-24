import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FavoriteEntityType, FavoriteIdsResponse, FavoriteResponse } from '../shared/models/favorites.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly BASE = `${environment.apiUrl}`;

  // Signals reactivas para el estado global de favoritos
  readonly favoritedEventIds = signal<Set<number>>(new Set());
  readonly favoritedServiceIds = signal<Set<number>>(new Set());
  readonly favoritedProfessionalIds = signal<Set<number>>(new Set());

  constructor() {
    // Escuchar cambios en la sesión de usuario de forma reactiva
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadFavoriteIds();
      } else {
        this.clearFavorites();
      }
    });
  }

  private clearFavorites(): void {
    this.favoritedEventIds.set(new Set());
    this.favoritedServiceIds.set(new Set());
    this.favoritedProfessionalIds.set(new Set());
  }

  loadFavoriteIds(): void {
    if (!this.authService.isLoggedIn) return;
    this.http.get<FavoriteIdsResponse>(`${this.BASE}/favorites/ids`).subscribe({
      next: res => {
        this.favoritedEventIds.set(new Set(res.eventIds));
        this.favoritedServiceIds.set(new Set(res.serviceIds));
        this.favoritedProfessionalIds.set(new Set(res.professionalIds));
      },
      error: err => {
        console.error('Error al cargar IDs de favoritos', err);
      }
    });
  }

  toggleFavorite(entityType: FavoriteEntityType, entityId: number): Observable<{ favorited: boolean }> {
    return this.http.post<{ favorited: boolean }>(`${this.BASE}/favorites/toggle`, { entityType, entityId }).pipe(
      tap(res => {
        if (entityType === 'EVENTO') {
          this.favoritedEventIds.update(set => {
            const next = new Set(set);
            res.favorited ? next.add(entityId) : next.delete(entityId);
            return next;
          });
        } else if (entityType === 'SERVICIO') {
          this.favoritedServiceIds.update(set => {
            const next = new Set(set);
            res.favorited ? next.add(entityId) : next.delete(entityId);
            return next;
          });
        } else if (entityType === 'PROFESIONAL') {
          this.favoritedProfessionalIds.update(set => {
            const next = new Set(set);
            res.favorited ? next.add(entityId) : next.delete(entityId);
            return next;
          });
        }
      })
    );
  }

  getFavorites(): Observable<FavoriteResponse[]> {
    return this.http.get<FavoriteResponse[]>(`${this.BASE}/favorites`);
  }
}
