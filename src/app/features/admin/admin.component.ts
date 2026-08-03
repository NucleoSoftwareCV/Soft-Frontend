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
  LucideTrash2,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import { CityService } from '../../services/city.service';
import { CityResponse } from '../../shared/models/evento.model';
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
    LucideTrash2,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  private readonly applicationsApi = inject(ProfessionalApplicationService);
  private readonly cityService = inject(CityService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;

  section = signal<'summary' | 'applications' | 'cities'>('summary');
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

  pendingOnPage = computed(
    () => this.applications().filter(item => item.status === 'PENDIENTE').length
  );

  constructor() {
    this.load(0);
  }

  show(section: 'summary' | 'applications' | 'cities'): void {
    this.section.set(section);
    this.selected.set(null);
    this.selectedCity.set(null);
    this.cityFormOpen.set(false);
    this.error.set(null);

    if (section === 'cities') {
      this.loadCities();
    }
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
