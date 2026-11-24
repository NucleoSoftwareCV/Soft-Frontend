import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OneToOneServiceCardResponse } from '../../models/one-to-one-service.model';
import { resolveAssetUrl } from '../../utils/asset-url.util';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&auto=format&fit=crop&q=85';

@Component({
  selector: 'app-sesion-card',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './sesion-card.component.html',
  styleUrl: './sesion-card.component.css',
})
export class SesionCardComponent {
  readonly sesion = input.required<OneToOneServiceCardResponse>();
  readonly selectionMode = input(false);
  readonly selected = input(false);
  readonly selectionDisabled = input(false);
  readonly serviceSelected = output<number>();

  imageFor(): string {
    return resolveAssetUrl(this.sesion().imageUrl) || FALLBACK_IMAGE;
  }

  specialistPhoto(): string | null {
    return resolveAssetUrl(this.sesion().specialistPhotoUrl) || null;
  }

  specialistInitial(): string {
    return this.sesion().specialistName?.trim().charAt(0).toUpperCase() || 'S';
  }

  formatPrice(): string {
    const sesion = this.sesion();
    if (sesion.price === null || sesion.price === undefined || Number(sesion.price) === 0) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: sesion.currency || 'PEN',
      maximumFractionDigits: 0,
    }).format(Number(sesion.price));
  }

  durationLabel(): string {
    const minutes = this.sesion().durationMinutes;
    return minutes ? `${minutes} min` : 'Duracion por confirmar';
  }
}
