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
  LucideBan,
  LucideBriefcaseBusiness,
  LucideCalendarClock,
  LucideCalendarDays,
  LucideChevronRight,
  LucideCircleCheck,
  LucideClock3,
  LucideEllipsis,
  LucideEye,
  LucideExternalLink,
  LucideGlobe2,
  LucideLanguages,
  LucideLayoutDashboard,
  LucideLink2,
  LucideMapPin,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePencil,
  LucidePlus,
  LucideRotateCw,
  LucideTriangleAlert,
  LucideUpload,
  LucideUserRound,
  LucideUsersRound,
  LucideZoomIn,
  LucideX,
  LucideUsers,
  LucideEyeOff,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { EventManagementService, OccurrenceAttendee } from '../../services/event-management.service';
import { EventosService } from '../../services/eventos.service';
import {
  SpecialistProfileResponse,
  SpecialistProfileService,
} from '../../services/profesionales.service';
import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import {
  EventManagementResponse,
  EventOccurrenceRequest,
  EventStatus,
  EventUpsertRequest,
} from '../../shared/models/event-management.model';
import {
  CategoryResponse,
  CityResponse,
  LocationResponse,
} from '../../shared/models/evento.model';
import {
  OneToOneFilterOption,
  OneToOneServiceDetailResponse,
  OneToOneServiceRequest,
} from '../../shared/models/one-to-one-service.model';
import { resolveAssetUrl } from '../../shared/utils/asset-url.util';
import { ExperienceTypeCatalogItem } from '../../shared/models/event-catalog.model';

type PortalSection = 'summary' | 'profile' | 'events' | 'sessions';
type EventStepKey = 'info' | 'format' | 'schedule' | 'extra';
type SessionStepKey = 'info' | 'format' | 'specialty';

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
  paymentMethod: 'WHATSAPP' | 'ONLINE';
  experienceTypeId: number | null;
  occurrenceId: number | null;
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

@Component({
  selector: 'app-professional-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageCropperComponent,
    LucideBan,
    LucideBriefcaseBusiness,
    LucideCalendarClock,
    LucideCalendarDays,
    LucideChevronRight,
    LucideCircleCheck,
    LucideClock3,
    LucideEllipsis,
    LucideEye,
    LucideExternalLink,
    LucideGlobe2,
    LucideLanguages,
    LucideLayoutDashboard,
    LucideLink2,
    LucideMapPin,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucidePencil,
    LucidePlus,
    LucideRotateCw,
    LucideTriangleAlert,
    LucideUpload,
    LucideUserRound,
    LucideUsersRound,
    LucideZoomIn,
    LucideX,
    LucideUsers,
    LucideEyeOff,
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
  experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  cities = signal<CityResponse[]>([]);
  workTopics = signal<OneToOneFilterOption[]>([]);
  techniques = signal<OneToOneFilterOption[]>([]);
  locations = signal<LocationResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  showEventForm = signal(false);
  showSessionForm = signal(false);
  showProfileForm = signal(false);
  showLanguageForm = signal(false);
  showSocialForm = signal(false);
  eventMenuId = signal<number | null>(null);
  cancelEventTarget = signal<EventManagementResponse | null>(null);
  eventActionId = signal<number | null>(null);
  sidebarCollapsed = signal(false);
  mobileNavOpen = signal(false);
  logoutConfirm = signal(false);
  cropAsset = signal<'photo' | 'banner' | null>(null);

  // ── Wizard: crear/editar evento ─────────────────────────────────────────
  // Nota: eventForm es un objeto plano (no signal), así que eventSteps/currentEventStepKey
  // se definen como métodos (no computed) para que siempre lean el eventForm.id vigente en
  // cada ciclo de detección de cambios, en vez de quedar cacheados con el primer valor leído.
  eventStepIndex = signal(0);

  eventSteps(): EventStepKey[] {
    return this.eventForm.id
      ? ['info', 'format', 'extra']
      : ['info', 'format', 'schedule', 'extra'];
  }

  currentEventStepKey(): EventStepKey {
    return this.eventSteps()[this.eventStepIndex()];
  }

  // ── Wizard: crear/editar sesión 1:1 ─────────────────────────────────────
  sessionStepIndex = signal(0);
  sessionSteps: SessionStepKey[] = ['info', 'format', 'specialty'];

  currentSessionStepKey(): SessionStepKey {
    return this.sessionSteps[this.sessionStepIndex()];
  }

  // ── Panel de fechas programadas ─────────────────────────────────────────
  occurrencesPanelEventId = signal<number | null>(null);
  occurrencesPanelItem = computed(
    () => this.events().find(item => item.event.id === this.occurrencesPanelEventId()) ?? null
  );

  // ── Participants modal ──────────────────────────────────────────────────
  showParticipantsModal = signal(false);
  participantsLoading = signal(false);
  participantsError = signal<string | null>(null);
  participantsList = signal<OccurrenceAttendee[]>([]);
  selectedAttendeeDetail = signal<OccurrenceAttendee | null>(null);
  participantsOccurrenceLabel = signal<string>('');
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
    this.mobileNavOpen.set(false);
    this.clearMessages();
  }

  // ── Wizard: evento ───────────────────────────────────────────────────────
  nextEventStep(): void {
    if (!this.validateEventStep(this.currentEventStepKey())) return;
    this.eventStepIndex.update(index => Math.min(index + 1, this.eventSteps().length - 1));
  }

  prevEventStep(): void {
    this.eventStepIndex.update(index => Math.max(index - 1, 0));
  }

  goToEventStep(index: number): void {
    if (index <= this.eventStepIndex()) this.eventStepIndex.set(index);
  }

  eventStepLabel(key: EventStepKey): string {
    return {
      info: 'Información',
      format: 'Formato y precio',
      schedule: 'Primera fecha',
      extra: 'Detalles',
    }[key];
  }

  private validateEventStep(key: EventStepKey): boolean {
    this.clearMessages();
    if (key === 'info') {
      if (!this.eventForm.title.trim() || !this.eventForm.categoryId || !this.eventForm.description.trim()) {
        this.failed('Completa el título, la categoría y la descripción antes de continuar.');
        return false;
      }
      return true;
    }
    if (key === 'format') {
      if (this.eventForm.priceFrom < 0) {
        this.failed('El precio no puede ser negativo.');
        return false;
      }
      return true;
    }
    if (key === 'schedule') return this.validateEventOccurrence();
    return true;
  }

  // ── Wizard: sesión 1:1 ────────────────────────────────────────────────────
  nextSessionStep(): void {
    if (!this.validateSessionStep(this.currentSessionStepKey())) return;
    this.sessionStepIndex.update(index => Math.min(index + 1, this.sessionSteps.length - 1));
  }

  prevSessionStep(): void {
    this.sessionStepIndex.update(index => Math.max(index - 1, 0));
  }

  goToSessionStep(index: number): void {
    if (index <= this.sessionStepIndex()) this.sessionStepIndex.set(index);
  }

  sessionStepLabel(key: SessionStepKey): string {
    return {
      info: 'Información',
      format: 'Formato y publicación',
      specialty: 'Especialidad',
    }[key];
  }

  private validateSessionStep(key: SessionStepKey): boolean {
    this.clearMessages();
    if (key === 'info') {
      if (!this.sessionForm.title.trim() || !this.sessionForm.description.trim()) {
        this.failed('Completa el título y la descripción antes de continuar.');
        return false;
      }
      return true;
    }
    if (key === 'format') {
      if (this.sessionForm.durationMinutes <= 0) {
        this.failed('La duración debe ser mayor que cero.');
        return false;
      }
      if (this.sessionForm.price < 0) {
        this.failed('El precio no puede ser negativo.');
        return false;
      }
      return true;
    }
    return true;
  }

  // ── Panel de fechas programadas ──────────────────────────────────────────
  openOccurrencesPanel(item: EventManagementResponse): void {
    this.occurrencesPanelEventId.set(item.event.id);
  }

  closeOccurrencesPanel(): void {
    this.occurrencesPanelEventId.set(null);
  }

  syncOccurrenceEndTime(): void {
    if (!this.occurrenceForm.startsAt) return;
    const startsAt = new Date(this.occurrenceForm.startsAt);
    const endsAt = new Date(this.occurrenceForm.endsAt);
    if (!this.occurrenceForm.endsAt || endsAt <= startsAt) {
      startsAt.setHours(startsAt.getHours() + 2);
      this.occurrenceForm.endsAt = this.toLocalInput(startsAt.toISOString());
    }
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadProfile();
    this.loadEvents();
    this.loadSessions();
    this.publicEventsApi.getCategorias().subscribe({
      next: categories => this.categories.set(categories),
    });
    this.publicEventsApi.getExperienceTypes().subscribe({
      next: types => this.experienceTypes.set(types),
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
    this.sessionsApi.getActiveLocations().subscribe({
      next: locations => this.locations.set(locations),
      error: () => this.failed('No se pudieron cargar las ubicaciones disponibles.'),
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
    return resolveAssetUrl(url);
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
    this.eventStepIndex.set(0);
    this.showEventForm.set(true);
  }

  openEditEvent(item: EventManagementResponse): void {
    const event = item.event;
    const occurrence = item.occurrences[0];
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
      paymentMethod: event.paymentMethod ?? 'WHATSAPP',
      experienceTypeId: event.experienceTypeId,
      occurrenceId: occurrence?.id ?? null,
      startsAt: occurrence ? this.toLocalInput(occurrence.startsAt) : this.localDateTime(2),
      endsAt: occurrence ? this.toLocalInput(occurrence.endsAt) : this.localDateTime(2, 2),
      capacity: occurrence?.capacity ?? 12,
      meetingUrl: occurrence?.meetingLink?.meetingUrl ?? 'https://meet.google.com/',
      locationName: occurrence?.location?.name ?? '',
      addressLine1: occurrence?.location?.address ?? '',
      cityId: this.cities().find(city => city.name === occurrence?.location?.cityName)?.id ?? null,
      status: item.status === 'PUBLICADO' ? 'PUBLICADO' : 'BORRADOR',
    };
    this.eventStepIndex.set(0);
    this.showEventForm.set(true);
  }

  saveEvent(): void {
    const profile = this.profile();
    if (!profile || !this.eventForm.categoryId || !this.eventForm.experienceTypeId) {
      this.failed('Selecciona la categoria y el tipo de experiencia antes de guardar el evento.');
      return;
    }
    if (!this.validateEventOccurrence()) return;

    this.saving.set(true);
    this.clearMessages();
    const event = this.eventRequest(profile.id);
    const editingId = this.eventForm.id;
    const occurrence = this.eventOccurrenceRequest();
    const operation = editingId
      ? this.eventsApi.update(editingId, event).pipe(
          switchMap(() => this.eventForm.occurrenceId
            ? this.eventsApi.updateOccurrence(this.eventForm.occurrenceId, occurrence)
            : this.eventsApi.addOccurrence(editingId, occurrence)),
          map(() => editingId)
        )
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
    this.eventActionId.set(item.event.id);
    this.eventMenuId.set(null);
    this.eventsApi.updateStatus(item.event.id, status).subscribe({
      next: () => {
        this.eventActionId.set(null);
        this.succeeded(status === 'CANCELADO'
          ? 'Evento cancelado correctamente.'
          : 'Estado del evento actualizado.');
        this.loadEvents();
      },
      error: () => {
        this.eventActionId.set(null);
        this.failed('No se pudo cambiar el estado del evento.');
      },
    });
  }

  toggleEventMenu(eventId: number): void {
    this.eventMenuId.update(current => current === eventId ? null : eventId);
  }

  requestEventCancellation(item: EventManagementResponse): void {
    this.eventMenuId.set(null);
    this.cancelEventTarget.set(item);
  }

  confirmEventCancellation(): void {
    const item = this.cancelEventTarget();
    if (!item) return;
    this.cancelEventTarget.set(null);
    this.changeEventStatus(item, 'CANCELADO');
  }

  eventLocation(item: EventManagementResponse): string {
    const occurrence = item.occurrences[0];
    if (item.event.modality === 'ONLINE') return 'Online';
    return occurrence?.location?.name || occurrence?.location?.cityName || 'Lugar por confirmar';
  }

  openNewSession(): void {
    this.sessionForm = this.emptySessionForm();
    this.sessionStepIndex.set(0);
    this.showSessionForm.set(true);
  }

  openEditSession(item: OneToOneServiceDetailResponse): void {
    this.sessionForm = {
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
      durationMinutes: item.durationMinutes ?? 60,
      modality: item.modality,
      locationId: item.locationId,
      price: item.price ?? 0,
      currency: item.currency,
      status: item.status,
      workTopics: this.idsForNames(this.workTopics(), item.workTopics ?? []),
      techniques: this.idsForNames(this.techniques(), item.techniques ?? []),
    };
    this.sessionStepIndex.set(0);
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
    if (this.sessionForm.modality !== 'ONLINE' && !this.sessionForm.locationId) {
      this.failed('Selecciona una ubicación para la modalidad presencial.');
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
      locationId: this.sessionForm.modality === 'ONLINE' ? null : this.sessionForm.locationId,
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
      next: savedSession => {
        this.saving.set(false);
        this.showSessionForm.set(false);
        this.sessions.update(current => {
          const withoutSaved = current.filter(item => item.id !== savedSession.id);
          return [savedSession, ...withoutSaved];
        });
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
      next: sessions => this.sessions.set(Array.isArray(sessions) ? sessions : []),
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
      paymentMethod: this.eventForm.paymentMethod,
      experienceTypeId: this.eventForm.experienceTypeId!,
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
      paymentMethod: 'WHATSAPP',
      experienceTypeId: null,
      occurrenceId: null,
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

  // ── Participants modal methods ──────────────────────────────────────────
  verParticipantes(occurrence: EventOccurrenceManagement): void {
    const label = new Date(occurrence.startsAt).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    this.participantsOccurrenceLabel.set(label);
    this.participantsList.set([]);
    this.selectedAttendeeDetail.set(null);
    this.participantsError.set(null);
    this.participantsLoading.set(true);
    this.showParticipantsModal.set(true);

    this.eventsApi.getOccurrenceAttendees(occurrence.id).subscribe({
      next: list => {
        this.participantsList.set(list);
        this.participantsLoading.set(false);
      },
      error: err => {
        this.participantsError.set(this.apiError(err, 'No se pudo cargar la lista de participantes.'));
        this.participantsLoading.set(false);
      }
    });
  }

  cerrarParticipantes(): void {
    this.showParticipantsModal.set(false);
    this.selectedAttendeeDetail.set(null);
    this.participantsList.set([]);
  }

  mostrarDetalleAsistente(attendee: OccurrenceAttendee): void {
    this.selectedAttendeeDetail.set(attendee);
  }

  volverAListado(): void {
    this.selectedAttendeeDetail.set(null);
  }
}
