import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideCheck,
  LucideLaptop,
  LucideMail,
  LucideMapPin,
  LucideMessageCircle,
  LucideSave,
  LucideUsers,
} from '@lucide/angular';
import { forkJoin, switchMap } from 'rxjs';

import { CityService } from '../../services/city.service';
import { ClientPreferencesService } from '../../services/client-preferences.service';
import { EventCatalogService } from '../../services/event-catalog.service';
import { OnboardingService } from '../../services/onboarding.service';
import { ClientProfilePreferencesResponse } from '../../shared/models/client-preferences.model';
import { CategoryCatalogItem, ExperienceTypeCatalogItem } from '../../shared/models/event-catalog.model';
import { CityResponse, EventModality } from '../../shared/models/evento.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideCheck,
    LucideLaptop,
    LucideMail,
    LucideMapPin,
    LucideMessageCircle,
    LucideSave,
    LucideUsers,
  ],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css',
})
export class PreferencesComponent implements OnInit {
  readonly EventModality = EventModality;
  private readonly onboardingService = inject(OnboardingService);
  private readonly preferencesService = inject(ClientPreferencesService);
  private readonly catalogService = inject(EventCatalogService);
  private readonly cityService = inject(CityService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly categories = signal<CategoryCatalogItem[]>([]);
  readonly cities = signal<CityResponse[]>([]);
  readonly experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  readonly selectedCategoryIds = signal<Set<number>>(new Set());
  readonly selectedExperienceTypeIds = signal<Set<number>>(new Set());
  readonly selectedCityId = signal<number | null>(null);
  readonly additionalCityName = signal('');
  readonly selectedModality = signal<EventModality | null>(null);
  readonly profile = signal<ClientProfilePreferencesResponse | null>(null);

  communicationEmail = '';
  whatsappPhone = '';
  receiveSavedEventConfirmations = true;
  receivePersonalizedRecommendations = true;
  receiveReservationConfirmations = true;
  receiveWeeklySummary = false;

  readonly featuredCities = computed(() => this.cities().slice(0, 6));
  readonly additionalCities = computed(() => this.cities().slice(6));
  readonly selectedAdditionalCity = computed(() => {
    const selected = this.selectedCityId();
    return this.additionalCities().some(city => city.id === selected) ? selected : null;
  });

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      onboarding: this.onboardingService.getState(),
      profile: this.preferencesService.getPreferences(),
      categories: this.catalogService.getCategories(),
      cities: this.cityService.getCities(),
      experienceTypes: this.catalogService.getExperienceTypes(),
    }).subscribe({
      next: ({ onboarding, profile, categories, cities, experienceTypes }) => {
        this.profile.set(profile);
        this.categories.set(categories.filter(item => item.active));
        this.cities.set(cities.filter(item => item.active));
        this.experienceTypes.set(experienceTypes.filter(item => item.active));
        this.selectedCategoryIds.set(new Set(onboarding.categoryIds));
        this.selectedCityId.set(onboarding.cityId ?? profile.cityId);
        this.selectedExperienceTypeIds.set(new Set(onboarding.experienceTypeIds));
        this.selectedModality.set(onboarding.modality);
        this.communicationEmail = profile.communicationEmail;
        this.whatsappPhone = profile.whatsappPhone ?? '';
        this.receiveSavedEventConfirmations = profile.receiveSavedEventConfirmations;
        this.receivePersonalizedRecommendations = profile.receivePersonalizedRecommendations;
        this.receiveReservationConfirmations = profile.receiveReservationConfirmations;
        this.receiveWeeklySummary = profile.receiveWeeklySummary;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No pudimos cargar tus preferencias. Intentalo de nuevo.');
      },
    });
  }

  toggleCategory(id: number): void {
    this.selectedCategoryIds.update(current => this.toggleSet(current, id));
  }

  toggleExperienceType(id: number): void {
    this.selectedExperienceTypeIds.update(current => this.toggleSet(current, id));
  }

  selectCity(value: number | string | null): void {
    if (value === null || value === '') return;

    this.selectedCityId.set(Number(value));
    this.additionalCityName.set('');
  }
  onAdditionalCityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    this.additionalCityName.set(value);

    if (value.trim()) {
      this.selectedCityId.set(null);
    }
  }
  sanitizeWhatsapp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const startsWithPlus = input.value.trim().startsWith('+');
    const digits = input.value.replace(/\D/g, '').slice(0, 15);
    this.whatsappPhone = `${startsWithPlus ? '+' : ''}${digits}`;
    input.value = this.whatsappPhone;
  }

  save(): void {
    const profile = this.profile();
    const cityId = this.selectedCityId();
    const categoryIds = [...this.selectedCategoryIds()];
    if (!profile || !cityId || !categoryIds.length || !this.communicationEmail.trim()) {
      this.toast.error('Selecciona al menos un tema y una ciudad, e indica un email valido.');
      return;
    }

    this.saving.set(true);
    this.preferencesService.savePreferences({
      firstName: profile.firstName,
      lastName: profile.lastName,
      cityId,
      communicationEmail: this.communicationEmail.trim(),
      whatsappPhone: this.whatsappPhone.trim() || null,
      receiveSavedEventConfirmations: this.receiveSavedEventConfirmations,
      receivePersonalizedRecommendations: this.receivePersonalizedRecommendations,
      receiveReservationConfirmations: this.receiveReservationConfirmations,
      receiveWeeklySummary: this.receiveWeeklySummary,
      categoryIds,
    }).pipe(
      switchMap(savedProfile => {
        this.profile.set(savedProfile);
        return this.onboardingService.savePreferences({
          cityId,
          experienceTypeIds: [...this.selectedExperienceTypeIds()],
          modality: this.selectedModality(),
        });
      }),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Tus preferencias se guardaron correctamente.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudieron guardar tus preferencias.');
      },
    });
  }

  private toggleSet(current: Set<number>, id: number): Set<number> {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }
}
