import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
} from 'ngx-image-cropper';
import {
  LucideBriefcaseBusiness,
  LucideCalendarDays,
  LucideCircleCheck,
  LucideClock3,
  LucideEye,
  LucideExternalLink,
  LucideGlobe2,
  LucideLanguages,
  LucideLayoutDashboard,
  LucideLink2,
  LucideLogOut,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePencil,
  LucidePlus,
  LucideRotateCw,
  LucideTriangleAlert,
  LucideUpload,
  LucideUserRound,
  LucideZoomIn,
  LucideX,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { EventManagementService } from '../../services/event-management.service';
import { EventosService } from '../../services/eventos.service';
import {
  SpecialistProfileResponse,
  SpecialistProfileService,
} from '../../services/profesionales.service';
import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import {
  EventManagementResponse,
  EventOccurrenceManagement,
  EventOccurrenceRequest,
  EventStatus,
  EventUpsertRequest,
} from '../../shared/models/event-management.model';
import {
  CategoryResponse,
  CityResponse,
} from '../../shared/models/evento.model';
import {
  OneToOneFilterOption,
  OneToOneServiceDetailResponse,
  OneToOneServiceRequest,
} from '../../shared/models/one-to-one-service.model';
import { environment } from '../../../environments/environment';

type PortalSection = 'summary' | 'profile' | 'events' | 'sessions';

interface EventForm {
  id: number | null;
  title: string;
  summary: string;
  description: string;
  includes: string;
  highlights: string;
  whatToBring: string;
  modality: 'ONLINE' | 'PRESENCIAL';
  priceFrom: number;
  currency: string;
  minimumAge: number;
  categoryId: number | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  meetingUrl: string;
  locationName: string;
  addressLine1: string;
  cityId: number | null;
  status: 'BORRADOR' | 'PUBLICADO';
}

interface SessionForm {
  id: number | null;
  title: string;
  description: string;
  imageUrl: string;
  durationMinutes: number;
  modality: 'ONLINE' | 'PRESENCIAL' | 'AMBAS';
  locationId: number | null;
  price: number;
  currency: string;
  status: 'BORRADOR' | 'PUBLICADO' | 'OCULTO';
  workTopics: number[];
  techniques: number[];
}

interface OccurrenceForm {
  id: number | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  meetingUrl: string;
  locationName: string;
  address: string;
  cityId: number | null;
}

@Component({
  selector: 'app-professional-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageCropperComponent,
    LucideBriefcaseBusiness,
    LucideCalendarDays,
    LucideCircleCheck,
    LucideClock3,
    LucideEye,
    LucideExternalLink,
    LucideGlobe2,
    LucideLanguages,
    LucideLayoutDashboard,
    LucideLink2,
    LucideLogOut,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucidePencil,
    LucidePlus,
    LucideRotateCw,
    LucideTriangleAlert,
    LucideUpload,
    LucideUserRound,
    LucideZoomIn,
    LucideX,
  ],
  templateUrl: './professional-portal.component.html',
  styleUrl: './professional-portal.component.css',
})
export class ProfessionalPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profileApi = inject(SpecialistProfileService);
  private readonly eventsApi = inject(EventManagementService);
  private readonly publicEventsApi = inject(EventosService);
  private readonly sessionsApi = inject(OneToOneServicesService);

  section = signal<PortalSection>('summary');
  profile = signal<SpecialistProfileResponse | null>(null);
  events = signal<EventManagementResponse[]>([]);
  sessions = signal<OneToOneServiceDetailResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  cities = signal<CityResponse[]>([]);
  workTopics = signal<OneToOneFilterOption[]>([]);
  techniques = signal<OneToOneFilterOption[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  showEventForm = signal(false);
  showSessionForm = signal(false);
  showProfileForm = signal(false);
  showLanguageForm = signal(false);
  showSocialForm = signal(false);
  occurrenceEvent = signal<EventManagementResponse | null>(null);
  sidebarCollapsed = signal(false);
  logoutConfirm = signal(false);
  cropAsset = signal<'photo' | 'banner' | null>(null);
  cropImageFile = signal<File | null>(null);
  cropImageUrl = signal<string | null>(null);
  cropTransform: ImageTransform = { scale: 1, rotate: 0 };
  croppedImage: Blob | null = null;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  profileForm = {
    publicName: '',
    profileCategory: 'PROFESIONALES',
    biography: '',
    description: '',
    whatsappPhone: '',
    phoneNumber: '',
    publicEmail: '',
    website: '',
    workTopicIds: [] as number[],
    techniqueIds: [] as number[],
  };
  socialPlatform = 'INSTAGRAM';
  socialUrl = '';
  languageName = '';

  eventForm: EventForm = this.emptyEventForm();
  sessionForm: SessionForm = this.emptySessionForm();
  occurrenceForm: OccurrenceForm = this.emptyOccurrenceForm();

  publishedEvents = computed(
    () => this.events().filter(item => item.status === 'PUBLICADO').length
  );
  publishedSessions = computed(
    () => this.sessions().filter(item => item.status === 'PUBLICADO').length
  );
  missingProfileRequirements = computed(() => {
    const profile = this.profile();
    if (!profile) return [];

    return [
      { label: 'Foto de perfil', complete: Boolean(profile.photoUrl?.trim()) },
      { label: 'Banner', complete: Boolean(profile.bannerUrl?.trim()) },
      { label: 'Biografía', complete: Boolean(profile.biography?.trim()) },
      { label: 'Descripción', complete: Boolean(profile.description?.trim()) },
      { label: 'WhatsApp', complete: Boolean(profile.whatsappPhone?.trim()) },
    ].filter(requirement => !requirement.complete);
  });

  constructor() {
    this.loadAll();
  }

  show(section: PortalSection): void {
    this.section.set(section);
    this.clearMessages();
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadProfile();
    this.loadEvents();
    this.loadSessions();
    this.publicEventsApi.getCategorias().subscribe({
      next: categories => this.categories.set(categories),
    });
    this.publicEventsApi.getCiudades().subscribe({
      next: cities => this.cities.set(cities.filter(city => city.active)),
    });
    this.sessionsApi.getActiveWorkTopics().subscribe({
      next: topics => {
        this.workTopics.set(topics);
        this.hydrateProfileSelections();
      },
    });
    this.sessionsApi.getActiveTechniques().subscribe({
      next: techniques => {
        this.techniques.set(techniques);
        this.hydrateProfileSelections();
      },
    });
  }

  saveProfile(): void {
    this.saving.set(true);
    this.clearMessages();
    this.profileApi.updateMine({ ...this.profileForm }).subscribe({
      next: profile => {
        this.profile.set(profile);
        this.saving.set(false);
        this.showProfileForm.set(false);
        this.succeeded('Perfil actualizado.');
      },
      error: error => this.failed(this.apiError(error, 'No se pudo actualizar el perfil.')),
    });
  }

  openProfileEditor(): void {
    this.clearMessages();
    this.showProfileForm.set(true);
  }

  saveSocialLink(): void {
    if (!this.socialUrl.trim()) return;
    this.saving.set(true);
    this.profileApi.saveSocialLink(this.socialPlatform, this.socialUrl.trim()).subscribe({
      next: () => {
        this.socialUrl = '';
        this.saving.set(false);
        this.showSocialForm.set(false);
        this.succeeded('Red social guardada.');
        this.loadProfile();
      },
      error: () => this.failed('No se pudo guardar la red social.'),
    });
  }

  deleteSocialLink(platform: string): void {
    this.profileApi.deleteSocialLink(platform).subscribe({
      next: () => this.loadProfile(),
      error: () => this.failed('No se pudo eliminar la red social.'),
    });
  }

  saveLanguage(): void {
    if (!this.languageName.trim()) return;
    this.saving.set(true);
    this.profileApi.saveLanguage(this.languageName.trim()).subscribe({
      next: () => {
        this.languageName = '';
        this.saving.set(false);
        this.showLanguageForm.set(false);
        this.succeeded('Idioma guardado.');
        this.loadProfile();
      },
      error: () => this.failed('No se pudo guardar el idioma.'),
    });
  }

  deleteLanguage(id: number): void {
    this.profileApi.deleteLanguage(id).subscribe({
      next: () => this.loadProfile(),
      error: () => this.failed('No se pudo eliminar el idioma.'),
    });
  }

  toggleProfilePublication(): void {
    const profile = this.profile();
    if (!profile) return;
    this.saving.set(true);
    const request = profile.publicationStatus === 'PUBLICADO'
      ? this.profileApi.unpublishMine()
      : this.profileApi.publishMine();
    request.subscribe({
      next: updated => {
        this.profile.set(updated);
        this.saving.set(false);
        this.succeeded(
          updated.publicationStatus === 'PUBLICADO'
            ? 'Tu perfil ya es visible públicamente.'
            : 'Tu perfil se ocultó del directorio público.'
        );
      },
      error: error => this.failed(
        this.apiError(error, 'No se pudo cambiar la visibilidad del perfil.')
      ),
    });
  }

  selectProfileAsset(event: Event, asset: 'photo' | 'banner'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.openImageCropper(asset, file);
    input.value = '';
  }

  dropProfileAsset(event: DragEvent, asset: 'photo' | 'banner'): void {
    event.preventDefault();
    const file = Array.from(event.dataTransfer?.files ?? [])
      .find(candidate => candidate.type.startsWith('image/'));

    if (file) {
      this.openImageCropper(asset, file);
      return;
    }

    const imageUrl = this.extractDroppedImageUrl(event.dataTransfer);
    if (!imageUrl) {
      this.failed('Suelta una imagen o un enlace directo a una imagen pública.');
      return;
    }

    this.clearMessages();
    this.cropAsset.set(asset);
    this.cropImageFile.set(null);
    this.cropImageUrl.set(imageUrl);
    this.resetCropper();
  }

  allowAssetDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  sanitizeWhatsapp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    const formatted = digits.length > 2
      ? `+${digits.slice(0, 2)} ${digits.slice(2)}`
      : digits.length ? `+${digits}` : '';
    input.value = formatted;
    this.profileForm.whatsappPhone = formatted;
  }

  sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    input.value = digits;
    this.profileForm.phoneNumber = digits;
  }

  profileAssetUrl(url?: string): string {
    if (!url || /^(https?:|data:|blob:)/i.test(url)) return url ?? '';
    if (!environment.apiUrl.startsWith('http')) return url;
    return `${new URL(environment.apiUrl).origin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImage = event.blob ?? null;
  }

  updateCropZoom(event: Event): void {
    const scale = Number((event.target as HTMLInputElement).value);
    this.cropTransform = { ...this.cropTransform, scale };
  }

  rotateCropImage(): void {
    this.cropTransform = {
      ...this.cropTransform,
      rotate: ((this.cropTransform.rotate ?? 0) + 90) % 360,
    };
  }

  cropImageLoadFailed(): void {
    this.failed(
      this.cropImageUrl()
        ? 'El sitio de origen bloqueó la carga de esa imagen. Prueba arrastrándola directamente o utiliza otro enlace público.'
        : 'No se pudo leer la imagen seleccionada.'
    );
    this.closeImageCropper();
  }

  confirmImageCrop(): void {
    const asset = this.cropAsset();
    if (!asset || !this.croppedImage) {
      this.failed('Ajusta la imagen antes de confirmar el recorte.');
      return;
    }

    const file = new File(
      [this.croppedImage],
      asset === 'photo' ? 'profile-photo.jpg' : 'profile-banner.jpg',
      { type: 'image/jpeg' }
    );

    this.saving.set(true);
    this.clearMessages();
    const operation = asset === 'photo'
      ? this.profileApi.uploadPhoto(file)
      : this.profileApi.uploadBanner(file);

    operation.subscribe({
      next: profile => {
        this.profile.set(profile);
        this.saving.set(false);
        this.closeImageCropper();
        this.succeeded(asset === 'photo' ? 'Foto actualizada.' : 'Banner actualizado.');
      },
      error: error => {
        this.failed(this.apiError(error, `No se pudo subir ${asset === 'photo' ? 'la foto' : 'el banner'}.`));
      },
    });
  }

  closeImageCropper(): void {
    this.cropAsset.set(null);
    this.cropImageFile.set(null);
    this.cropImageUrl.set(null);
    this.resetCropper();
  }

  cropAspectRatio(): number {
    return this.cropAsset() === 'photo' ? 1 : 1248 / 256;
  }

  cropWidth(): number {
    return this.cropAsset() === 'photo' ? 126 : 1248;
  }

  cropHeight(): number {
    return this.cropAsset() === 'photo' ? 126 : 256;
  }

  openNewEvent(): void {
    this.eventForm = this.emptyEventForm();
    this.showEventForm.set(true);
  }

  openEditEvent(item: EventManagementResponse): void {
    const event = item.event;
    this.eventForm = {
      id: event.id,
      title: event.title,
      summary: event.summary ?? '',
      description: event.description,
      includes: (event.includes ?? []).join(', '),
      highlights: (event.highlights ?? []).join(', '),
      whatToBring: (event.whatToBring ?? []).join(', '),
      modality: event.modality,
      priceFrom: event.priceFrom,
      currency: event.currency,
      minimumAge: event.minimumAge ?? 18,
      categoryId: event.categoryId,
      startsAt: this.localDateTime(2),
      endsAt: this.localDateTime(2, 2),
      capacity: 12,
      meetingUrl: 'https://meet.google.com/',
      locationName: '',
      addressLine1: '',
      cityId: null,
      status: item.status === 'PUBLICADO' ? 'PUBLICADO' : 'BORRADOR',
    };
    this.showEventForm.set(true);
  }

  saveEvent(): void {
    const profile = this.profile();
    if (!profile || !this.eventForm.categoryId) {
      this.failed('Selecciona una categoria antes de guardar el evento.');
      return;
    }
    if (!this.eventForm.id && !this.validateEventOccurrence()) return;

    this.saving.set(true);
    this.clearMessages();
    const event = this.eventRequest(profile.id);
    const editingId = this.eventForm.id;
    const operation = editingId
      ? this.eventsApi.update(editingId, event).pipe(map(() => editingId))
      : this.eventsApi.create({ event, occurrence: this.eventOccurrenceRequest() })
          .pipe(map(response => response.event.id));
    const currentStatus = editingId
      ? this.events().find(item => item.event.id === editingId)?.status
      : 'BORRADOR';

    operation.pipe(
      switchMap(eventId => currentStatus === this.eventForm.status
        ? of(eventId)
        : this.eventsApi.updateStatus(eventId, this.eventForm.status).pipe(map(() => eventId)))
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEventForm.set(false);
        this.succeeded(editingId
          ? 'Evento actualizado correctamente.'
          : this.eventForm.status === 'PUBLICADO'
            ? 'Evento creado y publicado en Explorar.'
            : 'Evento creado como borrador.');
        this.loadEvents();
      },
      error: error => this.failed(this.apiError(error, 'No se pudo guardar el evento. Revisa los campos.')),
    });
  }

  setEventModality(modality: 'ONLINE' | 'PRESENCIAL'): void {
    this.eventForm.modality = modality;
  }

  syncEventEndTime(): void {
    if (!this.eventForm.startsAt) return;
    const startsAt = new Date(this.eventForm.startsAt);
    const endsAt = new Date(this.eventForm.endsAt);
    if (!this.eventForm.endsAt || endsAt <= startsAt) {
      startsAt.setHours(startsAt.getHours() + 2);
      this.eventForm.endsAt = this.toLocalInput(startsAt.toISOString());
    }
  }

  minimumDateTime(): string {
    return this.toLocalInput(new Date().toISOString());
  }

  eventDurationLabel(): string {
    if (!this.eventForm.startsAt || !this.eventForm.endsAt) return '';
    const minutes = Math.round(
      (new Date(this.eventForm.endsAt).getTime() - new Date(this.eventForm.startsAt).getTime()) / 60_000
    );
    if (minutes <= 0) return 'La hora final debe ser posterior al inicio.';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `Duracion: ${hours ? `${hours} h` : ''}${hours && rest ? ' ' : ''}${rest ? `${rest} min` : ''}`;
  }

  changeEventStatus(item: EventManagementResponse, status: EventStatus): void {
    this.eventsApi.updateStatus(item.event.id, status).subscribe({
      next: () => this.loadEvents(),
      error: () => this.failed('No se pudo cambiar el estado del evento.'),
    });
  }

  openOccurrence(item: EventManagementResponse): void {
    this.occurrenceEvent.set(item);
    this.occurrenceForm = this.emptyOccurrenceForm();
  }

  openEditOccurrence(item: EventManagementResponse, occurrence: EventOccurrenceManagement): void {
    this.occurrenceEvent.set(item);
    this.occurrenceForm = {
      id: occurrence.id,
      startsAt: this.toLocalInput(occurrence.startsAt),
      endsAt: this.toLocalInput(occurrence.endsAt),
      capacity: occurrence.capacity,
      meetingUrl: occurrence.meetingLink?.meetingUrl ?? '',
      locationName: occurrence.location?.name ?? '',
      address: occurrence.location?.address ?? '',
      cityId: this.cities().find(city => city.name === occurrence.location?.cityName)?.id ?? null,
    };
  }

  saveOccurrence(): void {
    const item = this.occurrenceEvent();
    if (!item) return;
    const request: EventOccurrenceRequest = {
      startsAt: new Date(this.occurrenceForm.startsAt).toISOString(),
      endsAt: new Date(this.occurrenceForm.endsAt).toISOString(),
      capacity: this.occurrenceForm.capacity,
      meetingLink: item.event.modality === 'ONLINE'
        ? {
            platform: 'MEET',
            meetingUrl: this.occurrenceForm.meetingUrl,
          }
        : null,
      location: item.event.modality === 'PRESENCIAL'
        ? {
            name: this.occurrenceForm.locationName,
            address: this.occurrenceForm.address,
            cityId: this.occurrenceForm.cityId!,
          }
        : null,
    };
    const operation = this.occurrenceForm.id
      ? this.eventsApi.updateOccurrence(this.occurrenceForm.id, request)
      : this.eventsApi.addOccurrence(item.event.id, request);
    operation.subscribe({
      next: () => {
        this.occurrenceEvent.set(null);
        this.loadEvents();
      },
      error: () => this.failed('No se pudo agregar la fecha.'),
    });
  }

  cancelOccurrence(id: number): void {
    this.eventsApi.updateOccurrenceStatus(id, 'CANCELADA').subscribe({
      next: () => this.loadEvents(),
      error: () => this.failed('No se pudo cancelar la fecha.'),
    });
  }

  openNewSession(): void {
    this.sessionForm = this.emptySessionForm();
    this.showSessionForm.set(true);
  }

  openEditSession(item: OneToOneServiceDetailResponse): void {
    this.sessionForm = {
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      imageUrl: '',
      durationMinutes: item.durationMinutes ?? 60,
      modality: item.modality,
      locationId: item.locationId,
      price: item.price ?? 0,
      currency: item.currency,
      status: item.status,
      workTopics: this.idsForNames(this.workTopics(), item.workTopics ?? []),
      techniques: this.idsForNames(this.techniques(), item.techniques ?? []),
    };
    this.showSessionForm.set(true);
  }

  saveSession(): void {
    if (this.sessionForm.durationMinutes <= 0) {
      this.failed('La duración debe ser mayor que cero.');
      return;
    }
    if (this.sessionForm.price < 0) {
      this.failed('El precio no puede ser negativo.');
      return;
    }
    this.saving.set(true);
    this.clearMessages();
    const editingId = this.sessionForm.id;
    const request: OneToOneServiceRequest = {
      title: this.sessionForm.title,
      description: this.sessionForm.description,
      imageUrl: this.sessionForm.imageUrl || undefined,
      durationMinutes: this.sessionForm.durationMinutes,
      modality: this.sessionForm.modality,
      locationId: this.sessionForm.locationId,
      price: this.sessionForm.price,
      currency: this.sessionForm.currency,
      status: this.sessionForm.status,
      workTopics: this.sessionForm.workTopics,
      techniques: this.sessionForm.techniques,
    };
    const operation = this.sessionForm.id
      ? this.sessionsApi.updateService(this.sessionForm.id, request)
      : this.sessionsApi.createService(request);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.showSessionForm.set(false);
        this.succeeded(editingId
          ? 'Sesión 1:1 actualizada correctamente.'
          : this.sessionForm.status === 'PUBLICADO'
            ? 'Sesión creada y publicada en Sesiones 1:1.'
            : 'Sesión creada como borrador.');
        this.loadSessions();
      },
      error: error => this.failed(this.apiError(error, 'No se pudo guardar la sesión. Revisa los campos.')),
    });
  }

  changeSessionStatus(
    item: OneToOneServiceDetailResponse,
    status: 'BORRADOR' | 'PUBLICADO' | 'OCULTO'
  ): void {
    this.sessionsApi.updateStatus(item.id, status).subscribe({
      next: () => this.loadSessions(),
      error: () => this.failed('No se pudo cambiar el estado de la sesión.'),
    });
  }

  toggleSelection(values: number[], id: number): void {
    const index = values.indexOf(id);
    index >= 0 ? values.splice(index, 1) : values.push(id);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  private loadProfile(): void {
    this.profileApi.getMine().subscribe({
      next: profile => {
        this.profile.set(profile);
        Object.assign(this.profileForm, {
          publicName: profile.publicName,
          profileCategory: profile.profileCategory,
          biography: profile.biography ?? '',
          description: profile.description ?? '',
          whatsappPhone: profile.whatsappPhone,
          phoneNumber: profile.phoneNumber ?? '',
          publicEmail: profile.publicEmail ?? '',
          website: profile.website ?? '',
        });
        this.hydrateProfileSelections();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el perfil profesional.');
      },
    });
  }

  private loadEvents(): void {
    this.eventsApi.getMine().subscribe({
      next: response => this.events.set(response.content),
      error: () => this.error.set('No se pudieron cargar los eventos.'),
    });
  }

  private loadSessions(): void {
    this.sessionsApi.getMyServices().subscribe({
      next: sessions => this.sessions.set(sessions),
      error: () => this.error.set('No se pudieron cargar las sesiones 1:1.'),
    });
  }

  private eventRequest(specialistId: number): EventUpsertRequest {
    return {
      title: this.eventForm.title,
      summary: this.eventForm.summary || null,
      description: this.eventForm.description,
      includes: this.csv(this.eventForm.includes),
      highlights: this.csv(this.eventForm.highlights),
      whatToBring: this.csv(this.eventForm.whatToBring),
      modality: this.eventForm.modality,
      priceFrom: this.eventForm.priceFrom,
      currency: this.eventForm.currency,
      minimumAge: this.eventForm.minimumAge,
      featured: false,
      categoryId: this.eventForm.categoryId!,
      specialistId,
    };
  }

  private eventOccurrenceRequest(): EventOccurrenceRequest {
    return {
      startsAt: new Date(this.eventForm.startsAt).toISOString(),
      endsAt: new Date(this.eventForm.endsAt).toISOString(),
      capacity: this.eventForm.capacity,
      meetingLink: this.eventForm.modality === 'ONLINE'
        ? {
            platform: 'MEET',
            meetingUrl: this.eventForm.meetingUrl,
          }
        : null,
      location: this.eventForm.modality === 'PRESENCIAL' && this.eventForm.cityId
        ? {
            name: this.eventForm.locationName,
            address: this.eventForm.addressLine1,
            cityId: this.eventForm.cityId,
          }
        : null,
    };
  }

  private emptyEventForm(): EventForm {
    return {
      id: null,
      title: '',
      summary: '',
      description: '',
      includes: '',
      highlights: '',
      whatToBring: '',
      modality: 'ONLINE',
      priceFrom: 0,
      currency: 'EUR',
      minimumAge: 18,
      categoryId: null,
      startsAt: this.localDateTime(2),
      endsAt: this.localDateTime(2, 2),
      capacity: 12,
      meetingUrl: 'https://meet.google.com/',
      locationName: '',
      addressLine1: '',
      cityId: null,
      status: 'PUBLICADO',
    };
  }

  private emptySessionForm(): SessionForm {
    return {
      id: null,
      title: '',
      description: '',
      imageUrl: '',
      durationMinutes: 60,
      modality: 'ONLINE',
      locationId: null,
      price: 0,
      currency: 'EUR',
      status: 'PUBLICADO',
      workTopics: [],
      techniques: [],
    };
  }

  private emptyOccurrenceForm(): OccurrenceForm {
    return {
      id: null,
      startsAt: this.localDateTime(2),
      endsAt: this.localDateTime(2, 2),
      capacity: 12,
      meetingUrl: 'https://meet.google.com/',
      locationName: '',
      address: '',
      cityId: null,
    };
  }

  private idsForNames(options: OneToOneFilterOption[], names: string[]): number[] {
    return options.filter(option => names.includes(option.name)).map(option => option.id);
  }

  private hydrateProfileSelections(): void {
    const profile = this.profile();
    if (!profile) return;
    this.profileForm.workTopicIds = this.idsForNames(
      this.workTopics(),
      profile.workTopics ?? []
    );
    this.profileForm.techniqueIds = this.idsForNames(
      this.techniques(),
      profile.techniques ?? []
    );
  }

  private csv(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  private localDateTime(days: number, additionalHours = 0): string {
    const value = new Date();
    value.setDate(value.getDate() + days);
    value.setHours(10 + additionalHours, 0, 0, 0);
    return this.toLocalInput(value.toISOString());
  }

  private validateEventOccurrence(): boolean {
    const startsAt = new Date(this.eventForm.startsAt);
    const endsAt = new Date(this.eventForm.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      this.failed('Selecciona una fecha y hora válidas.');
      return false;
    }
    if (startsAt <= new Date()) {
      this.failed('La fecha de inicio debe estar en el futuro.');
      return false;
    }
    if (endsAt <= startsAt) {
      this.failed('La hora final debe ser posterior a la hora de inicio.');
      return false;
    }
    if (this.eventForm.capacity < 1) {
      this.failed('La capacidad debe ser de al menos una persona.');
      return false;
    }
    if (this.eventForm.modality === 'ONLINE' && !this.eventForm.meetingUrl.trim()) {
      this.failed('Añade el enlace de la sesión online.');
      return false;
    }
    if (this.eventForm.modality === 'PRESENCIAL' &&
        (!this.eventForm.locationName.trim() || !this.eventForm.addressLine1.trim() || !this.eventForm.cityId)) {
      this.failed('Completa el lugar, la dirección y la ciudad del evento presencial.');
      return false;
    }
    return true;
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private openImageCropper(asset: 'photo' | 'banner', file: File): void {
    if (!file.type.startsWith('image/')) {
      this.failed('El archivo seleccionado debe ser una imagen.');
      return;
    }

    this.clearMessages();
    this.cropAsset.set(asset);
    this.cropImageFile.set(file);
    this.cropImageUrl.set(null);
    this.resetCropper();
  }

  private extractDroppedImageUrl(dataTransfer: DataTransfer | null): string | null {
    if (!dataTransfer) return null;

    const uri = dataTransfer.getData('text/uri-list')
      .split(/\r?\n/)
      .find(line => line && !line.startsWith('#'));
    const plainText = dataTransfer.getData('text/plain').trim();
    const html = dataTransfer.getData('text/html');
    const htmlSource = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const candidate = uri || htmlSource || plainText;

    if (!candidate) return null;

    try {
      const url = new URL(candidate);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  private resetCropper(): void {
    this.croppedImage = null;
    this.cropTransform = { scale: 1, rotate: 0 };
  }

  private clearMessages(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    this.error.set(null);
    this.notice.set(null);
  }

  private failed(message: string): void {
    this.saving.set(false);
    this.notice.set(null);
    this.error.set(message);
    this.scheduleMessageDismiss();
  }

  private succeeded(message: string): void {
    this.error.set(null);
    this.notice.set(message);
    this.scheduleMessageDismiss();
  }

  dismissError(): void {
    this.error.set(null);
  }

  dismissNotice(): void {
    this.notice.set(null);
  }

  private scheduleMessageDismiss(): void {
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => {
      this.error.set(null);
      this.notice.set(null);
      this.messageTimer = null;
    }, 6500);
  }

  private apiError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.error?.detail || fallback;
    }
    return fallback;
  }
}
