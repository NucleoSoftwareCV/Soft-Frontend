import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EventCardResponse, EventModality } from '../../models/evento.model';
import { EventosService } from '../../../services/eventos.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { categoryIcon } from '../../utils/category-icon.util';

@Component({
  selector: 'app-evento-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css'
})
export class EventoCardComponent {

  @Input({ required: true })
  evento!: EventCardResponse;

  private readonly eventosService = inject(EventosService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly favoritos = this.favoritesService.favoritedEventIds;

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';

  assetUrl(url: string | null | undefined): string {
    return this.eventosService.resolveAssetUrl(url) ?? this.fallbackImage;
  }

  toggleFavorito(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.favoritesService
      .toggleFavorite('EVENTO', this.evento.id)
      .subscribe({
        error: err => {
          console.error('Error toggling favorite', err);
        }
      });
  }

  isFavorito(): boolean {
    return this.favoritos().has(this.evento.id);
  }

  categoryEmoji(name: string | null): string {
    return categoryIcon(name);
  }

  isOnline(): boolean {
    return this.evento.modality === EventModality.ONLINE;
  }

  formatDate(value: string | null): string {
    if (!value) return 'Fecha por confirmar';

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatPrice(): string {
    if (
      this.evento.priceFrom === null ||
      this.evento.priceFrom === undefined
    ) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.evento.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(this.evento.priceFrom);
  }
}