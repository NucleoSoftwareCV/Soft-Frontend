import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EventosService } from '../../services/eventos.service';
import { EventDetailResponse, EventOccurrenceResponse } from '../../shared/models/evento.model';

@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-evento.html',
  styleUrl: './detalle-evento.css'
})
export class DetalleEvento {
  private readonly route = inject(ActivatedRoute);
  private readonly eventosService = inject(EventosService);

  evento = signal<EventDetailResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  favorito = signal(false);

  readonly fallbackImages = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&auto=format&fit=crop&q=85',
  ];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvento(id);
  }

  getGalleryCount(): number {
    return this.fallbackImages.length;
  }

  toggleFavorito(): void {
    this.favorito.update(value => !value);
  }

  formatPrice(): string {
    const event = this.evento();
    if (!event || event.priceFrom === null || event.priceFrom === undefined) return 'Gratis';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: event.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(event.priceFrom);
  }

  formatOccurrenceDate(occurrence: EventOccurrenceResponse | undefined): string {
    if (!occurrence?.startsAt) return 'Fecha por confirmar';
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(occurrence.startsAt));
  }

  formatOccurrenceTime(occurrence: EventOccurrenceResponse | undefined): string {
    if (!occurrence?.startsAt) return 'Hora por confirmar';
    const start = new Date(occurrence.startsAt);
    const end = occurrence.endsAt ? new Date(occurrence.endsAt) : null;
    const formatter = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
  }

  primaryOccurrence(): EventOccurrenceResponse | undefined {
    return this.evento()?.occurrences?.[0];
  }

  locationLabel(): string {
    const event = this.evento();
    const occurrence = this.primaryOccurrence();
    if (event?.modality === 'ONLINE') return 'Online';
    return occurrence?.location?.name || occurrence?.location?.cityName || 'Ubicacion por confirmar';
  }

  cityLabel(): string {
    return this.primaryOccurrence()?.location?.cityName || 'Ciudad por confirmar';
  }

  availableSpotsLabel(): string {
    const occurrence = this.primaryOccurrence();
    if (!occurrence) return 'Por confirmar';
    if (occurrence.soldOut) return 'Agotado';
    return `${occurrence.availableSpots} disponibles`;
  }

  private loadEvento(id: number): void {
    if (!id) {
      this.error.set('Evento no encontrado.');
      this.loading.set(false);
      return;
    }

    this.eventosService.getEvento(id).subscribe({
      next: event => {
        this.evento.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar este evento.');
        this.loading.set(false);
      },
    });
  }
}
