import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideHeart,
  LucideLaptop,
  LucideMapPin,
  LucidePartyPopper,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { CityService } from '../../services/city.service';
import { EventCatalogService } from '../../services/event-catalog.service';
import { EventosService } from '../../services/eventos.service';
import { FavoritesService } from '../../services/favorites.service';
import { OnboardingService } from '../../services/onboarding.service';
import { ExperienceTypeCatalogItem, CategoryCatalogItem } from '../../shared/models/event-catalog.model';
import { CityResponse, EventCardResponse, EventModality } from '../../shared/models/evento.model';
import { ToastService } from '../../shared/services/toast.service';

type OnboardingStep = 'interests' | 'success' | 'events' | 'city' | 'types' | 'modality';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    LucideArrowRight,
    LucideCheck,
    LucideHeart,
    LucideLaptop,
    LucideMapPin,
    LucidePartyPopper,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  readonly EventModality = EventModality;
  private readonly onboardingService = inject(OnboardingService);
  private readonly catalogService = inject(EventCatalogService);
  private readonly cityService = inject(CityService);
  private readonly eventosService = inject(EventosService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<OnboardingStep>('interests');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly eventActionLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly categories = signal<CategoryCatalogItem[]>([]);
  readonly cities = signal<CityResponse[]>([]);
  readonly experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  readonly events = signal<EventCardResponse[]>([]);
  readonly selectedCategoryIds = signal<Set<number>>(new Set());
  readonly selectedExperienceTypeIds = signal<Set<number>>(new Set());
  readonly selectedCityId = signal<number | null>(null);
  readonly selectedModality = signal<EventModality | null>(null);
  readonly currentEventIndex = signal(0);
  readonly showAllCities = signal(false);
  readonly editMode = this.route.snapshot.queryParamMap.get('mode') === 'edit';

  readonly currentEvent = computed(() => this.events()[this.currentEventIndex()] ?? null);
  readonly visibleCities = computed(() =>
    this.showAllCities() ? this.cities() : this.cities().slice(0, 3)
  );
  readonly progress = computed(() => {
    const positions: Record<OnboardingStep, number> = {
      interests: 12,
      success: 25,
      events: 45,
      city: 65,
      types: 82,
      modality: 100,
    };
    return positions[this.step()];
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      state: this.onboardingService.getState(),
      categories: this.catalogService.getCategories(),
      cities: this.cityService.getCities(),
      experienceTypes: this.catalogService.getExperienceTypes(),
      events: this.eventosService.getEventos({ page: 0, size: 5, sort: 'startsAt,asc' }),
    }).subscribe({
      next: ({ state, categories, cities, experienceTypes, events }) => {
        this.categories.set(categories.filter(item => item.active));
        this.cities.set(cities.filter(item => item.active));
        this.experienceTypes.set(experienceTypes.filter(item => item.active));
        this.events.set(events.content.filter(event => !!event.startsAt).slice(0, 5));
        this.selectedCategoryIds.set(new Set(state.categoryIds));
        this.selectedCityId.set(state.cityId);
        this.selectedExperienceTypeIds.set(new Set(state.experienceTypeIds));
        this.selectedModality.set(state.modality);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No pudimos cargar tus opciones. Revisa tu conexion e intentalo de nuevo.');
      },
    });
  }

  toggleCategory(id: number): void {
    this.selectedCategoryIds.update(current => this.toggleSet(current, id));
  }

  toggleExperienceType(id: number): void {
    this.selectedExperienceTypeIds.update(current => this.toggleSet(current, id));
  }

  saveInterests(): void {
    const categoryIds = [...this.selectedCategoryIds()];
    if (!categoryIds.length) {
      this.toast.error('Selecciona al menos un tema para continuar.');
      return;
    }

    this.saving.set(true);
    this.onboardingService.saveInterests(categoryIds).subscribe({
      next: () => {
        this.saving.set(false);
        this.step.set(this.editMode ? 'events' : 'success');
        if (this.editMode && !this.events().length) this.step.set('city');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudieron guardar tus intereses.');
      },
    });
  }

  startPreferences(): void {
    this.step.set(this.events().length ? 'events' : 'city');
  }

  acceptCurrentEvent(): void {
    const event = this.currentEvent();
    if (!event) return;
    if (this.favoritesService.favoritedEventIds().has(event.id)) {
      this.advanceEvent();
      return;
    }

    this.eventActionLoading.set(true);
    this.favoritesService.toggleFavorite('EVENTO', event.id).subscribe({
      next: () => {
        this.eventActionLoading.set(false);
        this.advanceEvent();
      },
      error: () => {
        this.eventActionLoading.set(false);
        this.toast.error('No se pudo guardar este evento.');
      },
    });
  }

  rejectCurrentEvent(): void {
    this.advanceEvent();
  }

  skipEvents(): void {
    this.step.set('city');
  }

  continueFromCity(): void {
    this.step.set('types');
  }

  continueFromTypes(): void {
    this.step.set('modality');
  }

  skipExperienceTypes(): void {
    this.selectedExperienceTypeIds.set(new Set());
    this.continueFromTypes();
  }

  finish(modality: EventModality | null = this.selectedModality()): void {
    this.selectedModality.set(modality);
    this.saving.set(true);
    this.onboardingService.savePreferences({
      cityId: this.selectedCityId(),
      experienceTypeIds: [...this.selectedExperienceTypeIds()],
      modality,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editMode ? 'Tus preferencias se actualizaron.' : 'Tu experiencia ya esta personalizada.');
        this.router.navigate(['/explorar']);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudieron guardar tus preferencias.');
      },
    });
  }

  skipOnboarding(): void {
    this.saving.set(true);
    this.onboardingService.updateStatus('SKIPPED').subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/explorar']);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudo cerrar el onboarding.');
      },
    });
  }

  explore(): void {
    this.router.navigate(['/explorar']);
  }

  eventImage(event: EventCardResponse): string {
    return this.eventosService.resolveAssetUrl(event.coverImageUrl) ?? '/assets/hero-match-bienestar.webp';
  }

  private advanceEvent(): void {
    if (this.currentEventIndex() + 1 >= this.events().length) {
      this.step.set('city');
      return;
    }
    this.currentEventIndex.update(index => index + 1);
  }

  private toggleSet(current: Set<number>, id: number): Set<number> {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }
}
