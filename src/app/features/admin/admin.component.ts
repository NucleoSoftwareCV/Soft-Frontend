import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideClipboardList,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMapPin,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePencil,
  LucidePlus,
  LucideShieldCheck,
  LucideShapes,
  LucideSave,
  LucideTags,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import { CityService } from '../../services/city.service';
import { EventCatalogService } from '../../services/event-catalog.service';
import { SessionCatalogService } from '../../services/session-catalog.service';
import { ToastService } from '../../shared/services/toast.service';
import { CityResponse } from '../../shared/models/evento.model';
import {
  CategoryCatalogItem,
  ExperienceTypeCatalogItem,
} from '../../shared/models/event-catalog.model';
import { SessionCatalogItem, SessionCatalogUpsertRequest } from '../../shared/models/one-to-one-service.model';
import {
  PROFESSIONAL_TYPE_OPTIONS,
  ProfessionalApplicationResponse,
  ProfessionalApplicationStatus,
  ProfessionalType,
} from '../../shared/models/professional-application.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideClipboardList,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideMapPin,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucidePencil,
    LucidePlus,
    LucideShieldCheck,
    LucideShapes,
    LucideSave,
    LucideTags,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  private readonly applicationsApi = inject(ProfessionalApplicationService);
  private readonly cityService = inject(CityService);
  private readonly eventCatalogService = inject(EventCatalogService);
  private readonly sessionCatalogService = inject(SessionCatalogService);
  private readonly toastService = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;

  section = signal<'summary' | 'applications' | 'cities' | 'catalogs'>('summary');
  applications = signal<ProfessionalApplicationResponse[]>([]);
  selected = signal<ProfessionalApplicationResponse | null>(null);
  loading = signal(false);
  deciding = signal(false);
  error = signal<string | null>(null);
  status = signal<ProfessionalApplicationStatus | null>('PENDIENTE');
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  approvePending = signal(false);
  rejectMode = signal(false);
  rejectionReason = '';
  sidebarCollapsed = signal(false);
  logoutConfirm = signal(false);

  // Avatar interactivo
  avatarMenuOpen = signal(false);

  // CRUD Ciudades
  cities = signal<CityResponse[]>([]);
  selectedCity = signal<CityResponse | null>(null);
  cityFormOpen = signal(false);
  cityForm = {
    id: null as number | null,
    name: '',
    province: '',
    countryCode: 'ES',
    active: true,
  };
  cityDeleteConfirm = signal<CityResponse | null>(null);

  catalogTab = signal<'categories' | 'experienceTypes' | 'workTopics' | 'techniques'>('categories');
  categories = signal<CategoryCatalogItem[]>([]);
  experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  catalogFormOpen = signal(false);
  catalogDeleteConfirm = signal<CategoryCatalogItem | ExperienceTypeCatalogItem | null>(null);
  catalogForm = { id: null as number | null, name: '', description: '', emoji: '✨' };

  // CRUD Temas y técnicas de sesiones 1:1
  sessionWorkTopics = signal<SessionCatalogItem[]>([]);
  sessionTechniques = signal<SessionCatalogItem[]>([]);
  sessionCatalogFormOpen = signal(false);
  sessionCatalogSaving = signal(false);
  sessionCatalogForm = { id: null as number | null, name: '', active: true };
  sessionCatalogDeactivateConfirm = signal<SessionCatalogItem | null>(null);

  get activeSessionCatalogList(): SessionCatalogItem[] {
    return this.catalogTab() === 'workTopics' ? this.sessionWorkTopics() : this.sessionTechniques();
  }
  readonly categoryEmojis = [
    '🧘', '🧊', '🎨', '🏃', '💪', '🧠', '🎵', '✨',
    '🥗', '🌱', '💆', '🤰', '🚀', '🌿', '🫁', '☀️',
    '🌙', '💫', '🧘‍♀️', '🤸', '🏋️', '🫶', '🌸', '🔥',
  ];

  pendingOnPage = computed(
    () => this.applications().filter(item => item.status === 'PENDIENTE').length
  );

  constructor() {
    this.load(0);
  }

  show(section: 'summary' | 'applications' | 'cities' | 'catalogs'): void {
    this.section.set(section);
    this.selected.set(null);
    this.selectedCity.set(null);
    this.cityFormOpen.set(false);
    this.error.set(null);

    if (section === 'cities') {
      this.loadCities();
    } else if (section === 'catalogs') {
      this.loadCatalogs();
      this.loadSessionCatalogs();
    }
  }

  selectCatalogTab(tab: 'categories' | 'experienceTypes' | 'workTopics' | 'techniques'): void {
    this.catalogTab.set(tab);
    this.catalogFormOpen.set(false);
    this.catalogDeleteConfirm.set(null);
    this.sessionCatalogFormOpen.set(false);
    this.sessionCatalogDeactivateConfirm.set(null);
  }

  loadCatalogs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.eventCatalogService.getCategoriesForAdmin().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.finishCatalogLoad();
      },
      error: error => this.catalogFailed(error, 'No se pudieron cargar las categorias.'),
    });
    this.eventCatalogService.getExperienceTypesForAdmin().subscribe({
      next: types => {
        this.experienceTypes.set(types);
        this.finishCatalogLoad();
      },
      error: error => this.catalogFailed(error, 'No se pudieron cargar los tipos de experiencia.'),
    });
  }

  openNewCatalogItem(): void {
    this.catalogForm = { id: null, name: '', description: '', emoji: '✨' };
    this.catalogFormOpen.set(true);
  }

  openEditCatalogItem(item: CategoryCatalogItem | ExperienceTypeCatalogItem): void {
    this.catalogForm = {
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      emoji: 'emoji' in item ? item.emoji ?? '✨' : '✨',
    };
    this.catalogFormOpen.set(true);
  }

  saveCatalogItem(): void {
    const name = this.catalogForm.name.trim();
    if (!name) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    const category = this.catalogTab() === 'categories';
    if (category && !this.catalogForm.emoji) {
      this.error.set('Selecciona un emoji para la categoria.');
      return;
    }
    const payload = {
      name,
      description: this.catalogForm.description.trim() || null,
      ...(category ? { emoji: this.catalogForm.emoji } : {}),
    };
    const request = this.catalogForm.id
      ? category
        ? this.eventCatalogService.updateCategory(this.catalogForm.id, payload)
        : this.eventCatalogService.updateExperienceType(this.catalogForm.id, payload)
      : category
        ? this.eventCatalogService.createCategory(payload)
        : this.eventCatalogService.createExperienceType(payload);

    this.deciding.set(true);
    request.subscribe({
      next: () => {
        this.deciding.set(false);
        this.catalogFormOpen.set(false);
        this.loadCatalogs();
      },
      error: error => this.catalogFailed(error, 'No se pudo guardar el elemento.'),
    });
  }

  selectCategoryEmoji(emoji: string): void {
    this.catalogForm.emoji = emoji;
  }

  toggleCatalogItem(item: CategoryCatalogItem | ExperienceTypeCatalogItem): void {
    const request = this.catalogTab() === 'categories'
      ? this.eventCatalogService.toggleCategory(item.id)
      : this.eventCatalogService.toggleExperienceType(item.id);
    request.subscribe({
      next: () => this.loadCatalogs(),
      error: error => this.catalogFailed(error, 'No se pudo cambiar el estado.'),
    });
  }

  deleteCatalogItem(): void {
    const item = this.catalogDeleteConfirm();
    if (!item) return;
    const request = this.catalogTab() === 'categories'
      ? this.eventCatalogService.deleteCategory(item.id)
      : this.eventCatalogService.deleteExperienceType(item.id);
    this.deciding.set(true);
    request.subscribe({
      next: () => {
        this.deciding.set(false);
        this.catalogDeleteConfirm.set(null);
        this.loadCatalogs();
      },
      error: error => {
        this.catalogDeleteConfirm.set(null);
        this.catalogFailed(error, 'No se pudo eliminar. Desactivalo si ya esta relacionado.');
      },
    });
  }

  loadSessionCatalogs(): void {
    this.sessionCatalogService.getWorkTopicsForAdmin().subscribe({
      next: items => this.sessionWorkTopics.set(items),
      error: error => this.catalogFailed(error, 'No se pudieron cargar los temas de sesión.'),
    });
    this.sessionCatalogService.getTechniquesForAdmin().subscribe({
      next: items => this.sessionTechniques.set(items),
      error: error => this.catalogFailed(error, 'No se pudieron cargar las técnicas de sesión.'),
    });
  }

  openNewSessionCatalogItem(): void {
    this.sessionCatalogForm = { id: null, name: '', active: true };
    this.sessionCatalogFormOpen.set(true);
  }

  openEditSessionCatalogItem(item: SessionCatalogItem): void {
    this.sessionCatalogForm = { id: item.id, name: item.name, active: item.active };
    this.sessionCatalogFormOpen.set(true);
  }

  saveSessionCatalogItem(): void {
    const name = this.sessionCatalogForm.name.trim();
    if (!name) {
      this.toastService.error('El nombre es obligatorio.');
      return;
    }

    const isWorkTopic = this.catalogTab() === 'workTopics';
    const payload: SessionCatalogUpsertRequest = { name, active: this.sessionCatalogForm.active };
    const request = this.sessionCatalogForm.id
      ? (isWorkTopic
          ? this.sessionCatalogService.updateWorkTopic(this.sessionCatalogForm.id, payload)
          : this.sessionCatalogService.updateTechnique(this.sessionCatalogForm.id, payload))
      : (isWorkTopic
          ? this.sessionCatalogService.createWorkTopic(payload)
          : this.sessionCatalogService.createTechnique(payload));

    this.sessionCatalogSaving.set(true);
    request.subscribe({
      next: () => {
        this.sessionCatalogSaving.set(false);
        this.sessionCatalogFormOpen.set(false);
        this.toastService.success(isWorkTopic ? 'Tema de sesión guardado.' : 'Técnica de sesión guardada.');
        this.loadSessionCatalogs();
      },
      error: error => {
        this.sessionCatalogSaving.set(false);
        this.toastService.error(error?.error?.message ?? error?.error?.detail ?? 'No se pudo guardar el elemento.');
      },
    });
  }

  reactivateSessionCatalogItem(item: SessionCatalogItem): void {
    const isWorkTopic = this.catalogTab() === 'workTopics';
    const payload: SessionCatalogUpsertRequest = { name: item.name, active: true };
    const request = isWorkTopic
      ? this.sessionCatalogService.updateWorkTopic(item.id, payload)
      : this.sessionCatalogService.updateTechnique(item.id, payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Elemento reactivado.');
        this.loadSessionCatalogs();
      },
      error: error => this.toastService.error(error?.error?.message ?? error?.error?.detail ?? 'No se pudo reactivar.'),
    });
  }

  confirmDeactivateSessionCatalogItem(item: SessionCatalogItem): void {
    this.sessionCatalogDeactivateConfirm.set(item);
  }

  deactivateSessionCatalogItemConfirmed(): void {
    const item = this.sessionCatalogDeactivateConfirm();
    if (!item) return;

    const isWorkTopic = this.catalogTab() === 'workTopics';
    const request = isWorkTopic
      ? this.sessionCatalogService.deactivateWorkTopic(item.id)
      : this.sessionCatalogService.deactivateTechnique(item.id);

    this.sessionCatalogSaving.set(true);
    request.subscribe({
      next: () => {
        this.sessionCatalogSaving.set(false);
        this.sessionCatalogDeactivateConfirm.set(null);
        this.toastService.success('Elemento desactivado.');
        this.loadSessionCatalogs();
      },
      error: error => {
        this.sessionCatalogSaving.set(false);
        this.sessionCatalogDeactivateConfirm.set(null);
        this.toastService.error(error?.error?.message ?? error?.error?.detail ?? 'No se pudo desactivar.');
      },
    });
  }

  private finishCatalogLoad(): void {
    this.loading.set(false);
  }

  private catalogFailed(error: any, fallback: string): void {
    this.loading.set(false);
    this.deciding.set(false);
    this.error.set(error?.error?.detail ?? error?.error?.message ?? fallback);
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.applicationsApi.getForAdmin(this.status(), page, 10).subscribe({
      next: response => {
        this.applications.set(response.content);
        this.page.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las solicitudes.');
        this.loading.set(false);
      },
    });
  }

  filter(status: ProfessionalApplicationStatus | null): void {
    this.status.set(status);
    this.selected.set(null);
    this.load(0);
  }

  select(item: ProfessionalApplicationResponse): void {
    this.selected.set(item);
    this.rejectMode.set(false);
    this.approvePending.set(false);
    this.rejectionReason = '';
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  approve(): void {
    const item = this.selected();
    if (!item) return;
    this.deciding.set(true);
    this.applicationsApi.decide(item.id, { status: 'APROBADO' }).subscribe({
      next: () => this.finishDecision(),
      error: () => this.decisionFailed(),
    });
  }

  reject(): void {
    const item = this.selected();
    const reason = this.rejectionReason.trim();
    if (!item || !reason) {
      this.error.set('El motivo de rechazo es obligatorio.');
      return;
    }
    this.deciding.set(true);
    this.applicationsApi.decide(item.id, {
      status: 'RECHAZADO',
      rejectionReason: reason,
    }).subscribe({
      next: () => this.finishDecision(),
      error: () => this.decisionFailed(),
    });
  }

  professionalTypeLabel(type: ProfessionalType): string {
    return PROFESSIONAL_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/erp/login']);
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user || !user.username) return 'AD';
    const parts = user.username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  }

  // --- MÉTODOS CRUD CIUDADES ---

  loadCities(): void {
    this.loading.set(true);
    this.error.set(null);
    this.cityService.getCitiesForAdmin().subscribe({
      next: data => {
        this.cities.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ciudades.');
        this.loading.set(false);
      },
    });
  }

  openNewCity(): void {
    this.cityForm = {
      id: null,
      name: '',
      province: '',
      countryCode: 'ES',
      active: true,
    };
    this.selectedCity.set(null);
    this.cityFormOpen.set(true);
  }

  openEditCity(city: CityResponse): void {
    this.selectedCity.set(city);
    this.cityForm = {
      id: city.id,
      name: city.name,
      province: city.province,
      countryCode: city.countryCode,
      active: city.active,
    };
    this.cityFormOpen.set(true);
  }

  closeCityForm(): void {
    this.cityFormOpen.set(false);
    this.selectedCity.set(null);
  }

  saveCity(): void {
    if (!this.cityForm.name.trim()) {
      this.error.set('El nombre de la ciudad es obligatorio.');
      return;
    }

    const payload: Partial<CityResponse> = {
      name: this.cityForm.name.trim(),
      province: this.cityForm.province.trim() || undefined,
      countryCode: this.cityForm.countryCode.trim().toUpperCase(),
      active: this.cityForm.active,
    };

    this.deciding.set(true);
    this.error.set(null);

    const req = this.cityForm.id
      ? this.cityService.updateCity(this.cityForm.id, payload)
      : this.cityService.createCity(payload);

    req.subscribe({
      next: () => {
        this.deciding.set(false);
        this.cityFormOpen.set(false);
        this.selectedCity.set(null);
        this.loadCities();
      },
      error: (err) => {
        this.deciding.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar la ciudad.');
      },
    });
  }

  confirmDeleteCity(city: CityResponse): void {
    this.cityDeleteConfirm.set(city);
  }

  deleteCity(): void {
    const city = this.cityDeleteConfirm();
    if (!city) return;

    this.deciding.set(true);
    this.error.set(null);

    this.cityService.deleteCity(city.id).subscribe({
      next: () => {
        this.deciding.set(false);
        this.cityDeleteConfirm.set(null);
        this.loadCities();
      },
      error: (err) => {
        this.deciding.set(false);
        this.cityDeleteConfirm.set(null);
        this.error.set(err?.error?.message ?? 'No se pudo eliminar la ciudad. Puede estar siendo utilizada por una ubicación.');
      },
    });
  }

  toggleCityActive(city: CityResponse): void {
    const payload: Partial<CityResponse> = {
      ...city,
      active: !city.active,
    };

    this.cityService.updateCity(city.id, payload).subscribe({
      next: () => this.loadCities(),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo cambiar el estado de la ciudad.');
      },
    });
  }

  private finishDecision(): void {
    this.deciding.set(false);
    this.selected.set(null);
    this.rejectMode.set(false);
    this.approvePending.set(false);
    this.load(this.page());
  }

  private decisionFailed(): void {
    this.deciding.set(false);
    this.error.set('No se pudo registrar la decisión.');
  }
}
