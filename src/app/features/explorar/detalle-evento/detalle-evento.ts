import { EventTravelComponent } from '../../../shared/components/event-travel/event-travel.component';
import { Component, HostListener, PLATFORM_ID, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EventosService } from '../../../services/eventos.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { EventCardResponse, EventDetailResponse, EventOccurrenceResponse } from '../../../shared/models/evento.model';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CheckoutService, MyBooking } from '../../../services/checkout.service';
import { MyBookingsStore } from '../../../services/my-bookings.store';
import { NotificationsService } from '../../../services/notifications.service';
import { BookingIndicatorComponent } from '../../../shared/components/booking-indicator/booking-indicator.component';
import { BookingPaymentDialogComponent } from '../../../shared/components/booking-payment-dialog/booking-payment-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EventoCardComponent } from '../../../shared/components/evento-card/evento-card.component';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EventMapComponent } from '../../../shared/components/event-map/event-map.component';
import { CampaniaBadgeComponent } from '../../../shared/components/campania-badge/campania-badge.component';
import { EventMapPoint, hasMapCoordinates } from '../../../shared/models/event-map.model';
@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [BookingIndicatorComponent, BookingPaymentDialogComponent, EventTravelComponent, CommonModule, RouterLink, FormsModule, ConfirmDialogComponent, EventoCardComponent, EventMapComponent, CampaniaBadgeComponent],
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
  private readonly favoritesService = inject(FavoritesService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly myBookings = inject(MyBookingsStore);
  private readonly notifications = inject(NotificationsService);
  private readonly platformId = inject(PLATFORM_ID);
  private carouselInterval?: ReturnType<typeof setInterval>;

  evento = signal<EventDetailResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  favorito = computed(() => {
    const eventId = this.evento()?.id;
    return eventId ? this.favoritesService.favoritedEventIds().has(eventId) : false;
  });
  galleryOpen = signal(false);
  shareModalOpen = signal(false);
  shareLinkCopied = signal(false);
  following = signal(false);
  followLoading = signal(false);
  followError = signal<string | null>(null);
  showUnfollowDialog = signal(false);
  eventosSimilares = signal<EventCardResponse[]>([]);
  eventosDelOrganizador = signal<EventCardResponse[]>([]);
  eventosSimilaresSlide = signal(0);
  eventosOrganizadorSlide = signal(0);
  cardsPorSlide = signal(4);

  selectedImageIndex = signal(0);
  currentSlide = signal(0);

  // Reserva y Checkout
  showBookingModal = signal(false);
  bookingStep = signal(1); // 1: Datos de asistentes, 3: Solicitud enviada
  selectedOccurrence = signal<EventOccurrenceResponse | null>(null);
  numPlazas = signal(1);
  
  // Datos del comprador
  compradorNombre = signal('');
  compradorApellido = signal('');
  compradorEmail = signal('');
  compradorTelefono = signal('');

  // Asistentes adicionales
  asistentesAdicionales = signal<{ name: string; lastName: string; email: string }[]>([]);
  yoTambienAsisto = signal(true);

  // Estados de carga y error local
  bookingLoading = signal(false);
  bookingError = signal<string | null>(null);
  createdOrderCode = signal<string | null>(null);
  /** Campaña abierta en la que participa el evento (si hay varias, la primera). */
  readonly campaignBadge = computed(() => this.evento()?.campaignBadges?.[0] ?? null);
  /** Reserva activa del cliente en la fecha elegida: una fecha admite una sola. */
  readonly selectedBooking = computed(() => {
    const occurrence = this.selectedOccurrence();
    return occurrence ? this.myBookings.forOccurrence(occurrence.id) : null;
  });
  /** Reserva aceptada que se está pagando. */
  readonly paymentBooking = signal<MyBooking | null>(null);

  private galleryImages(): string[] {
    const images = this.evento()?.images ?? [];
    return images
      .map(image => this.eventosService.resolveAssetUrl(image.url))
      .filter((url): url is string => !!url);
  }

  hasGalleryImages(): boolean {
    return this.galleryImages().length > 0;
  }

  getTotalImagenes(): number {
    return this.galleryImages().length;
  }

  constructor() {
    this.actualizarCardsPorSlide();
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        this.resetEventState();
        this.loadEvento(Number(params.get('id')));
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    const previous = this.cardsPorSlide();
    this.actualizarCardsPorSlide();
    if (previous !== this.cardsPorSlide()) {
      this.eventosSimilaresSlide.set(0);
      this.eventosOrganizadorSlide.set(0);
    }
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown.escape')
  closeShareModalOnEscape(): void {
    if (this.shareModalOpen()) {
      this.closeShareModal();
    }
  }

  getGalleryCount(): number {
    return Math.min(this.galleryImages().length, 5);
  }

  getImagenesGaleria(): string[] {
    return this.galleryImages().slice(0, 5);
  }

  getTodasLasImagenes(): string[] {
    return this.galleryImages();
  }

  getImagenesExtra(): number {
    return Math.max(this.galleryImages().length - 5, 0);
  }

  hayImagenesExtra(): boolean {
    return this.galleryImages().length > 5;
  }

  toggleFavorito(): void {
    const eventId = this.evento()?.id;
    if (!eventId) return;

    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.favoritesService.toggleFavorite('EVENTO', eventId).subscribe({
      error: err => {
        console.error('Error toggling favorite', err);
      }
    });
  }

  toggleFollow(): void {
    const professionalId = this.evento()?.organizer?.id;
    if (!professionalId || this.followLoading()) return;

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.following()) {
      this.showUnfollowDialog.set(true);
      return;
    }

    this.updateFollow(true);
  }

  eventosSimilaresVisibles(): EventCardResponse[] {
    const start = this.eventosSimilaresSlide();
    return this.eventosSimilares().slice(start, start + this.cardsPorSlide());
  }

  eventosOrganizadorVisibles(): EventCardResponse[] {
    const start = this.eventosOrganizadorSlide();
    return this.eventosDelOrganizador().slice(start, start + this.cardsPorSlide());
  }

  puedeRetrocederSimilares(): boolean {
    return this.eventosSimilaresSlide() > 0;
  }

  puedeAvanzarSimilares(): boolean {
    return this.eventosSimilaresSlide() + this.cardsPorSlide() < this.eventosSimilares().length;
  }

  moverSimilares(direction: -1 | 1): void {
    this.eventosSimilaresSlide.update(current =>
      this.nextCarouselPosition(current, direction, this.eventosSimilares().length)
    );
  }

  puedeRetrocederOrganizador(): boolean {
    return this.eventosOrganizadorSlide() > 0;
  }

  puedeAvanzarOrganizador(): boolean {
    return this.eventosOrganizadorSlide() + this.cardsPorSlide() < this.eventosDelOrganizador().length;
  }

  moverEventosOrganizador(direction: -1 | 1): void {
    this.eventosOrganizadorSlide.update(current =>
      this.nextCarouselPosition(current, direction, this.eventosDelOrganizador().length)
    );
  }

  confirmUnfollow(): void {
    this.updateFollow(false);
  }

  cancelUnfollow(): void {
    if (!this.followLoading()) this.showUnfollowDialog.set(false);
  }

  private updateFollow(shouldFollow: boolean): void {
    const professionalId = this.evento()?.organizer?.id;
    if (!professionalId || this.followLoading()) return;

    this.followLoading.set(true);
    this.followError.set(null);
    const request = shouldFollow
      ? this.followService.follow(professionalId)
      : this.followService.unfollow(professionalId);

    request.subscribe({
      next: response => {
        this.following.set(response.following);
        this.followLoading.set(false);
        this.showUnfollowDialog.set(false);
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

  organizerPhotoUrl(): string {
    return this.eventosService.resolveAssetUrl(this.evento()?.organizer?.photoUrl) ?? '';
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

  readonly locationMapOpen = signal(false);
  readonly mapOccurrence = computed(() =>
    this.selectedOccurrence() ?? this.primaryOccurrence()
  );
  readonly eventMapPoints = computed<EventMapPoint[]>(() => {
    const event = this.evento();
    const occurrence = this.mapOccurrence();
    const location = occurrence?.location;
    if (!event || event.modality === 'ONLINE' || !occurrence ||
        !location || !hasMapCoordinates(location)) {
      return [];
    }
    return [{
      eventId: event.id,
      occurrenceId: occurrence.id,
      title: event.title,
      priceFrom: event.priceFrom,
      currency: event.currency,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt,
      locationName: location.name,
      address: location.address,
      cityName: location.cityName,
      latitude: location.latitude,
      longitude: location.longitude,
    }];
  });

  primaryOccurrence(): EventOccurrenceResponse | undefined {
    return this.evento()?.occurrences?.[0];
  }

  locationLabel(): string {
    const event = this.evento();
    const occurrence = this.mapOccurrence();
    if (event?.modality === 'ONLINE') return 'Online';
    return occurrence?.location?.name || occurrence?.location?.cityName || 'Ubicacion por confirmar';
  }

  cityLabel(): string {
    return this.mapOccurrence()?.location?.cityName || 'Ciudad por confirmar';
  }

  availableSpotsLabel(): string {
    const occurrence = this.primaryOccurrence();
    if (!occurrence) return 'Por confirmar';
    if (occurrence.status === 'EN_CURSO') return 'Ya en curso';
    if (occurrence.status === 'FINALIZADA') return 'Finalizado';
    if (occurrence.status === 'CANCELADA') return 'Cancelado';
    if (occurrence.soldOut) return 'Agotado';
    return `${occurrence.availableSpots} disponibles`;
  }

  isOccurrenceBookable(occurrence: EventOccurrenceResponse | null): boolean {
    return !!occurrence && occurrence.status === 'PROGRAMADA' && !occurrence.soldOut;
  }

  occurrenceUnavailableLabel(occurrence: EventOccurrenceResponse | null): string | null {
    if (!occurrence) return null;
    if (occurrence.status === 'EN_CURSO') return 'Ya en curso';
    if (occurrence.status === 'FINALIZADA') return 'Finalizado';
    if (occurrence.status === 'CANCELADA') return 'Cancelado';
    if (occurrence.soldOut) return 'Agotado';
    return null;
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
        if (event.occurrences && event.occurrences.length > 0) {
          const firstBookable = event.occurrences.find(occ => this.isOccurrenceBookable(occ));
          const requestedId = Number(this.route.snapshot.queryParamMap.get('occurrenceId'));
          const requested = event.occurrences.find(occ =>
            occ.id === requestedId && this.isOccurrenceBookable(occ)
          );
          this.selectedOccurrence.set(requested ?? firstBookable ?? event.occurrences[0]);
        }
        this.loading.set(false);
        this.loadFollowStatus(event.organizer?.id);
        this.loadRelatedEvents(event.id);
      },
      error: () => {
        this.error.set('No pudimos cargar este evento.');
        this.loading.set(false);
      },
    });
  }

  private loadRelatedEvents(eventId: number): void {
    this.eventosService.getEventosSimilares(eventId).subscribe({
      next: response => this.eventosSimilares.set(response.content),
      error: () => this.eventosSimilares.set([]),
    });

    this.eventosService.getOtrosEventosDelOrganizador(eventId).subscribe({
      next: response => this.eventosDelOrganizador.set(response.content),
      error: () => this.eventosDelOrganizador.set([]),
    });
  }

  private resetEventState(): void {
    this.loading.set(true);
    this.error.set(null);
    this.evento.set(null);
    this.selectedOccurrence.set(null);
    this.locationMapOpen.set(false);
    this.following.set(false);
    this.followError.set(null);
    this.showUnfollowDialog.set(false);
    this.eventosSimilares.set([]);
    this.eventosDelOrganizador.set([]);
    this.eventosSimilaresSlide.set(0);
    this.eventosOrganizadorSlide.set(0);
    this.selectedImageIndex.set(0);
    this.currentSlide.set(0);
  }

  private actualizarCardsPorSlide(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const width = window.innerWidth;
    if (width < 560) this.cardsPorSlide.set(1);
    else if (width < 820) this.cardsPorSlide.set(2);
    else if (width < 1120) this.cardsPorSlide.set(3);
    else this.cardsPorSlide.set(4);
  }

  private nextCarouselPosition(current: number, direction: -1 | 1, total: number): number {
    const step = this.cardsPorSlide();
    const lastStart = Math.max(0, total - step);
    return Math.min(lastStart, Math.max(0, current + direction * step));
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

  openShareModal(): void {
    this.shareModalOpen.set(true);
    this.shareLinkCopied.set(false);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeShareModal(): void {
    this.shareModalOpen.set(false);
    this.shareLinkCopied.set(false);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  eventShareUrl(): string {
    return isPlatformBrowser(this.platformId) ? window.location.href : '';
  }

  async copyEventLink(input?: HTMLInputElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = this.eventShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      if (!input) return;
      input.select();
      document.execCommand('copy');
    }

    this.shareLinkCopied.set(true);
    window.setTimeout(() => this.shareLinkCopied.set(false), 2500);
  }

  shareEvent(network: 'facebook' | 'messenger' | 'x' | 'whatsapp' | 'email'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = encodeURIComponent(this.eventShareUrl());
    const title = this.evento()?.title || 'este evento';
    const text = encodeURIComponent(`Te invito a vivir esta experiencia: ${title}`);
    const subject = encodeURIComponent(`Invitacion: ${title}`);
    let shareUrl: string;

    switch (network) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'messenger':
        shareUrl = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          ? `fb-messenger://share/?link=${url}`
          : 'https://www.messenger.com/';
        void this.copyEventLink();
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%0A${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${subject}&body=${text}%0A%0A${url}`;
        break;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
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

  selectOccurrence(occurrence: EventOccurrenceResponse): void {
    this.selectedOccurrence.set(occurrence);
  }

  bookingActionDisabled(): boolean {
    return !this.selectedBooking() && !this.isOccurrenceBookable(this.selectedOccurrence());
  }

  bookingActionLabel(): string {
    const booking = this.selectedBooking();
    if (booking) {
      return booking.status === 'ACEPTADA' ? 'Completar pago' : 'Ver mi reserva';
    }
    return this.occurrenceUnavailableLabel(this.selectedOccurrence()) ?? `Solicitar reserva - ${this.formatPrice()}`;
  }

  bookingAction(): void {
    const booking = this.selectedBooking();
    if (!booking) {
      this.abrirReserva();
    } else if (booking.status === 'ACEPTADA') {
      this.paymentBooking.set(booking);
    } else {
      void this.router.navigate(['/perfil'], { queryParams: { tab: 'reservas', reserva: booking.code } });
    }
  }

  onBookingPaid(): void {
    this.myBookings.refresh();
    this.notifications.refreshUnread();
  }

  abrirReserva(): void {
    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const occ = this.selectedOccurrence();
    if (!occ || !this.isOccurrenceBookable(occ) || occ.soldOut || occ.availableSpots <= 0) return;

    this.bookingError.set(null);
    this.bookingLoading.set(false);
    this.bookingStep.set(1);
    this.numPlazas.set(1);
    this.yoTambienAsisto.set(true);
    this.asistentesAdicionales.set([]);
    this.recalcularAsistentes();
    
    // Prefill comprador details
    const user = this.authService.currentUser();
    this.compradorNombre.set(user?.username ?? '');
    this.compradorEmail.set(user?.email ?? '');
    this.compradorTelefono.set('');

    this.createdOrderCode.set(null);

    this.showBookingModal.set(true);
    document.body.style.overflow = 'hidden'; // block scroll
  }

  cerrarReserva(): void {
    this.showBookingModal.set(false);
    document.body.style.overflow = ''; // restore scroll
  }

  toggleYoTambienAsisto(): void {
    this.yoTambienAsisto.set(!this.yoTambienAsisto());
    this.recalcularAsistentes();
  }

  recalcularAsistentes(): void {
    const plazas = this.numPlazas();
    const asisto = this.yoTambienAsisto();
    const needed = asisto ? plazas - 1 : plazas;

    const current = this.asistentesAdicionales();
    if (needed > current.length) {
      const added = Array.from({ length: needed - current.length }, () => ({ name: '', lastName: '', email: '' }));
      this.asistentesAdicionales.set([...current, ...added]);
    } else if (needed < current.length) {
      this.asistentesAdicionales.set(current.slice(0, needed));
    }
  }

  updatePlazas(delta: number): void {
    const nextVal = this.numPlazas() + delta;
    if (nextVal < 1) return;
    const occ = this.selectedOccurrence();
    if (occ && nextVal > occ.availableSpots) return;
    this.numPlazas.set(nextVal);
    this.recalcularAsistentes();
  }

  formatTotalPrice(): string {
    const event = this.evento();
    if (!event || event.priceFrom === null || event.priceFrom === undefined) return 'Gratis';
    const base = event.priceFrom * this.numPlazas();
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: event.currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(base);
  }

  confirmarReserva(): void {
    const event = this.evento();
    const occurrence = this.selectedOccurrence();
    if (!event || !occurrence) return;

    if (!this.compradorNombre().trim() || !this.compradorEmail().trim()) {
      this.bookingError.set('Por favor, completa los datos principales del titular.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.compradorEmail().trim())) {
      this.bookingError.set('El correo electrónico del titular no es válido.');
      return;
    }

    const adicionales = this.asistentesAdicionales();
    for (let i = 0; i < adicionales.length; i++) {
      const a = adicionales[i];
      if (!a.name.trim() || !a.lastName.trim() || !a.email.trim()) {
        this.bookingError.set(`Por favor, completa el nombre, apellido y correo del asistente adicional #${i + 1}.`);
        return;
      }
      if (!emailRegex.test(a.email.trim())) {
        this.bookingError.set(`El correo del asistente #${i + 1} no es válido.`);
        return;
      }
    }

    this.bookingError.set(null);

    const attendeesPayload = this.yoTambienAsisto()
      ? [
          {
            name: this.compradorNombre(),
            lastName: this.compradorApellido(),
            email: this.compradorEmail()
          },
          ...adicionales
        ]
      : adicionales;

    this.bookingLoading.set(true);
    this.checkoutService.createOrder({
      items: [
        {
          referenceId: occurrence.id,
          itemType: 'EVENTO' as const,
          quantity: this.numPlazas(),
          attendees: attendeesPayload
        }
      ],
      billingName: this.compradorNombre()
    }).subscribe({
      next: order => {
        this.bookingLoading.set(false);
        this.createdOrderCode.set(order.code);
        this.bookingStep.set(3);
        occurrence.reservedSpots += this.numPlazas();
        occurrence.availableSpots = Math.max(0, occurrence.capacity - occurrence.reservedSpots);
        this.myBookings.refresh();
        this.notifications.refreshUnread();
      },
      error: error => {
        this.bookingLoading.set(false);
        this.bookingError.set(error.error?.detail || error.error?.message || 'No se pudo enviar la solicitud.');
      }
    });
  }

}
