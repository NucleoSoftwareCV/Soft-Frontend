import { Component, inject, signal, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventosService } from '../../../services/eventos.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { EventDetailResponse, EventOccurrenceResponse } from '../../../shared/models/evento.model';
import { AuthService } from '../../../core/services/auth.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-evento.html',
  styleUrl: './detalle-evento.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetalleEvento implements OnDestroy{
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventosService = inject(EventosService);
  private readonly followService = inject(ProfessionalFollowService);
  private readonly authService = inject(AuthService);
  private carouselInterval?: ReturnType<typeof setInterval>;

  evento = signal<EventDetailResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  favorito = signal(false);
  galleryOpen = signal(false);
  following = signal(false);
  followLoading = signal(false);
  followError = signal<string | null>(null);

  selectedImageIndex = signal(0);
  currentSlide = signal(0);

  readonly fallbackImages = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&auto=format&fit=crop&q=85',

  ];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvento(id);
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  getGalleryCount(): number {
    return Math.min(this.fallbackImages.length, 5);
  }

  getImagenesGaleria(): string[] {
    return this.fallbackImages.slice(0, 5);
  }

  getTodasLasImagenes(): string[] {
    return this.fallbackImages;
  }

  getImagenesExtra(): number {
    return Math.max(this.fallbackImages.length - 5, 0);
  }

  hayImagenesExtra(): boolean {
    return this.fallbackImages.length > 5;
  }

  toggleFavorito(): void {
    this.favorito.update(value => !value);
  }

  toggleFollow(): void {
    const professionalId = this.evento()?.organizer?.id;
    if (!professionalId || this.followLoading()) return;

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.followLoading.set(true);
    this.followError.set(null);
    const request = this.following()
      ? this.followService.unfollow(professionalId)
      : this.followService.follow(professionalId);

    request.subscribe({
      next: response => {
        this.following.set(response.following);
        this.followLoading.set(false);
      },
      error: () => {
        this.followError.set('No pudimos actualizar el seguimiento. Intentalo de nuevo.');
        this.followLoading.set(false);
      },
    });
  }

  whatsappUrl(): string | null {
    const phone = this.evento()?.organizer?.whatsappPhone;
    const digits = phone?.replace(/\D/g, '');
    if (!digits) return null;

    const message = `Hola, tengo una consulta sobre el evento ${this.evento()?.title ?? ''}.`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
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
        this.loadFollowStatus(event.organizer?.id);
      },
      error: () => {
        this.error.set('No pudimos cargar este evento.');
        this.loading.set(false);
      },
    });
  }

  private loadFollowStatus(professionalId: number | undefined): void {
    if (!professionalId || !this.authService.isLoggedIn) return;

    this.followService.getStatus(professionalId).subscribe({
      next: response => this.following.set(response.following),
      error: () => this.following.set(false),
    });
  }

  formatRecurringSchedule(): string {
    const occurrences = this.evento()?.occurrences;

    if (!occurrences?.length) {
      return 'Por confirmar';
    }

    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    return formatter.format(new Date(occurrences[0].startsAt));
  }

  getOccurrenceWeekday(occurrence: EventOccurrenceResponse): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long'
    }).format(new Date(occurrence.startsAt));
  }

  getOccurrenceDay(occurrence: EventOccurrenceResponse): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric'
    }).format(new Date(occurrence.startsAt));
  }

  getOccurrenceMonthHour(occurrence: EventOccurrenceResponse): string {
    const date = new Date(occurrence.startsAt);

    const month = new Intl.DateTimeFormat('es-ES', {
      month: 'short'
    }).format(date);

    const hour = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);

    return `${month} · ${hour}`;
  }

  formatDuration(occurrence: EventOccurrenceResponse | undefined): string {
    if (!occurrence?.startsAt || !occurrence?.endsAt) return '';

    const inicio = new Date(occurrence.startsAt);
    const fin = new Date(occurrence.endsAt);

    const diffMs = fin.getTime() - inicio.getTime();
    const minutos = Math.round(diffMs / 60000);

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas > 0 && mins > 0) {
      return `${horas} hora ${mins} min`;
    }

    if (horas > 0) {
      return horas === 1 ? '1 hora' : `${horas} horas`;
    }

    return `${mins} min`;
  }

  openGallery(index: number): void {
    this.selectedImageIndex.set(index);
    this.galleryOpen.set(true);

    // Bloquear scroll de la página
    document.body.style.overflow = 'hidden';
  }

  closeGallery(): void {
    this.galleryOpen.set(false);

    // Restaurar scroll
    document.body.style.overflow = '';
  }

  nextImage(images: string[]): void {
    const next = (this.selectedImageIndex() + 1) % images.length;
    this.selectedImageIndex.set(next);
  }

  previousImage(images: string[]): void {
    const previous =
      (this.selectedImageIndex() - 1 + images.length) % images.length;

    this.selectedImageIndex.set(previous);
  }

  counterImageLabel(images: string[]): string {
    return `${this.currentSlide() + 1} / ${images.length}`;
  }

  counterImageModal(images: string[]): string {
    return `${this.selectedImageIndex() + 1} / ${images.length}`;
  }


  onSlideChange(event: any) {
    this.currentSlide.set(event.target.swiper.realIndex);
  }

}
