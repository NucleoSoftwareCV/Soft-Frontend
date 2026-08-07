import { Component, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EventosService } from '../../../services/eventos.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { EventDetailResponse, EventOccurrenceResponse } from '../../../shared/models/evento.model';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CheckoutService } from '../../../services/checkout.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
  private carouselInterval?: ReturnType<typeof setInterval>;

  evento = signal<EventDetailResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  favorito = computed(() => {
    const eventId = this.evento()?.id;
    return eventId ? this.favoritesService.favoritedEventIds().has(eventId) : false;
  });
  galleryOpen = signal(false);
  following = signal(false);
  followLoading = signal(false);
  followError = signal<string | null>(null);

  selectedImageIndex = signal(0);
  currentSlide = signal(0);

  // Reserva y Checkout
  showBookingModal = signal(false);
  bookingStep = signal(1); // 1: Datos de asistentes, 2: Pago online, 3: Éxito
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

  // Descuento
  tieneCodigoDescuento = signal(false);
  codigoDescuento = signal('');
  codigoAplicado = signal(false);
  mensajeDescuento = signal<string | null>(null);

  // Datos de pago
  paymentMethod = signal<'TARJETA' | 'YAPE'>('TARJETA');
  cardNumber = signal('');
  cardExpiration = signal('');
  cardCvv = signal('');
  cardHolderName = signal('');
  yapePhone = signal('');
  yapeOtp = signal('');

  // Estados de carga y error local
  bookingLoading = signal(false);
  bookingError = signal<string | null>(null);
  createdOrderCode = signal<string | null>(null);

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

  organizerPhotoUrl(): string {
    return this.eventosService.resolveAssetUrl(this.evento()?.organizer?.photoUrl)
      ?? this.fallbackImages[0];
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
          this.selectedOccurrence.set(firstBookable ?? event.occurrences[0]);
        }
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

  selectOccurrence(occurrence: EventOccurrenceResponse): void {
    this.selectedOccurrence.set(occurrence);
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
    this.tieneCodigoDescuento.set(false);
    this.codigoDescuento.set('');
    this.codigoAplicado.set(false);
    this.mensajeDescuento.set(null);
    this.asistentesAdicionales.set([]);
    this.recalcularAsistentes();
    
    // Prefill comprador details
    const user = this.authService.currentUser();
    this.compradorNombre.set(user?.username ?? '');
    this.compradorEmail.set(user?.email ?? '');
    this.compradorTelefono.set('');

    // Reset payment data
    this.paymentMethod.set('TARJETA');
    this.cardNumber.set('');
    this.cardExpiration.set('');
    this.cardCvv.set('');
    this.cardHolderName.set(user?.username ?? '');
    this.yapePhone.set('');
    this.yapeOtp.set('');
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

  aplicarCodigoDescuento(): void {
    const codigo = this.codigoDescuento().trim().toUpperCase();
    if (!codigo) {
      this.mensajeDescuento.set(null);
      this.codigoAplicado.set(false);
      return;
    }
    if (codigo === 'DESCUENTO10') {
      this.codigoAplicado.set(true);
      this.mensajeDescuento.set('Código DESCUENTO10 aplicado correctamente.');
    } else {
      this.codigoAplicado.set(false);
      this.mensajeDescuento.set('Código de descuento inválido.');
    }
  }

  formatTotalPrice(): string {
    const event = this.evento();
    if (!event || event.priceFrom === null || event.priceFrom === undefined) return 'Gratis';
    let base = event.priceFrom * this.numPlazas();
    if (this.codigoAplicado()) {
      base = base * 0.9; // 10% discount
    }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: event.currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(base);
  }

  formatTotalBeforeDiscount(): string {
    const event = this.evento();
    if (!event || event.priceFrom === null || event.priceFrom === undefined) return '';
    const base = event.priceFrom * this.numPlazas();
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: event.currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(base);
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    const matches = val.match(/\d{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    this.cardNumber.set(formatted);
    input.value = formatted;
  }

  onCardExpirationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    this.cardExpiration.set(val);
    input.value = val;
  }

  onCardCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    this.cardCvv.set(val);
    input.value = val;
  }

  onCardHolderNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^a-zA-Z\s]/g, '');
    this.cardHolderName.set(val);
    input.value = val;
  }

  onYapePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    this.yapePhone.set(val);
    input.value = val;
  }

  onYapeOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 6) val = val.substring(0, 6);
    this.yapeOtp.set(val);
    input.value = val;
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

    if (event.paymentMethod === 'WHATSAPP') {
      this.bookingLoading.set(true);
      const requestPayload = {
        items: [
          {
            referenceId: occurrence.id,
            itemType: 'EVENTO' as const,
            quantity: this.numPlazas(),
            attendees: attendeesPayload
          }
        ],
        billingName: this.compradorNombre()
      };

      this.checkoutService.createOrder(requestPayload).subscribe({
        next: order => {
          this.checkoutService.getWhatsAppLink(order.code).subscribe({
            next: redirect => {
              this.bookingLoading.set(false);
              this.createdOrderCode.set(order.code);
              this.bookingStep.set(3); // success screen
              if (redirect.redirectUrl) {
                window.open(redirect.redirectUrl, '_blank');
              }
            },
            error: () => {
              this.bookingLoading.set(false);
              this.bookingError.set('No se pudo generar el enlace de WhatsApp.');
            }
          });
        },
        error: error => {
          this.bookingLoading.set(false);
          this.bookingError.set(error.error?.message || 'No se pudo crear la reserva.');
        }
      });
    } else {
      if (this.bookingStep() === 1) {
        this.bookingStep.set(2);
      }
    }
  }

  realizarPagoOnline(): void {
    const occurrence = this.selectedOccurrence();
    if (!occurrence) return;

    if (this.paymentMethod() === 'TARJETA') {
      const cleanCard = this.cardNumber().replace(/\s/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 16) {
        this.bookingError.set('El número de tarjeta debe tener 15 o 16 dígitos.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(this.cardExpiration())) {
        this.bookingError.set('La fecha de expiración debe tener el formato MM/AA.');
        return;
      }
      const month = parseInt(this.cardExpiration().substring(0, 2), 10);
      if (month < 1 || month > 12) {
        this.bookingError.set('El mes de expiración no es válido (debe ser de 01 a 12).');
        return;
      }
      if (this.cardCvv().length < 3 || this.cardCvv().length > 4) {
        this.bookingError.set('El CVV debe tener 3 o 4 dígitos.');
        return;
      }
      if (!this.cardHolderName().trim()) {
        this.bookingError.set('Por favor, indica el nombre del titular.');
        return;
      }
    } else {
      if (this.yapePhone().length !== 9) {
        this.bookingError.set('El número de celular de Yape debe tener exactamente 9 dígitos.');
        return;
      }
      if (this.yapeOtp().length !== 6) {
        this.bookingError.set('El código de aprobación de Yape debe tener exactamente 6 dígitos.');
        return;
      }
    }

    this.bookingLoading.set(true);
    this.bookingError.set(null);

    const adicionales = this.asistentesAdicionales();
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

    const orderRequest = {
      items: [
        {
          referenceId: occurrence.id,
          itemType: 'EVENTO' as const,
          quantity: this.numPlazas(),
          attendees: attendeesPayload
        }
      ],
      billingName: this.compradorNombre()
    };

    this.checkoutService.createOrder(orderRequest).subscribe({
      next: order => {
        const paymentPayload = this.paymentMethod() === 'TARJETA' 
          ? {
              method: 'TARJETA' as const,
              cardNumber: this.cardNumber(),
              cardExpiration: this.cardExpiration(),
              cardCvv: this.cardCvv(),
              cardHolderName: this.cardHolderName() || this.compradorNombre()
            }
          : {
              method: 'YAPE' as const,
              yapePhone: this.yapePhone(),
              yapeOtp: this.yapeOtp()
            };

        this.checkoutService.processPayment(order.code, paymentPayload).subscribe({
          next: payResult => {
            this.bookingLoading.set(false);
            if (payResult.status === 'APROBADO') {
              this.createdOrderCode.set(order.code);
              this.bookingStep.set(3); // Éxito
              
              occurrence.reservedSpots += this.numPlazas();
              occurrence.availableSpots = Math.max(0, occurrence.capacity - occurrence.reservedSpots);
            } else {
              this.bookingError.set(payResult.errorMessage || 'El pago fue rechazado. Revisa tus fondos o tarjeta.');
            }
          },
          error: error => {
            this.bookingLoading.set(false);
            this.bookingError.set(error.error?.message || 'Error procesando el pago. Inténtalo de nuevo.');
          }
        });
      },
      error: error => {
        this.bookingLoading.set(false);
        this.bookingError.set(error.error?.message || 'No se pudo crear la reserva.');
      }
    });
  }

}
