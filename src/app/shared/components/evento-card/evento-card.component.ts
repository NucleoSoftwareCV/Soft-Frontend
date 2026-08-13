import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventCardResponse, EventModality } from '../../models/evento.model';
import { resolveAssetUrl } from '../../utils/asset-url.util';
import { categoryIcon } from '../../utils/category-icon.util';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';

@Component({
  selector: 'app-evento-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './evento-card.component.html',
  styleUrl: './evento-card.component.css',
})
export class EventoCardComponent {
  readonly evento = input.required<EventCardResponse>();

  assetUrl(url: string | null | undefined): string {
    return resolveAssetUrl(url) || FALLBACK_IMAGE;
  }

  categoryEmoji(name: string | null): string {
    return categoryIcon(name);
  }

  isOnline(): boolean {
    return this.evento().modality === EventModality.ONLINE;
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
    const item = this.evento();
    if (item.priceFrom === null || item.priceFrom === undefined) return 'Gratis';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: item.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(item.priceFrom);
  }
}
