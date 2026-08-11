import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  CategoryCatalogItem,
  ExperienceTypeCatalogItem,
} from '../shared/models/event-catalog.model';
import { CityResponse } from '../shared/models/evento.model';
import { EventCatalogService } from './event-catalog.service';
import { CityService } from './city.service';

@Injectable({ providedIn: 'root' })
export class FiltrosService {
  private readonly catalogApi = inject(EventCatalogService);
  private readonly cityApi = inject(CityService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  filterWhen = signal<string | null>(null);
  filterCategories = signal<string[]>([]);
  filterTypes = signal<string[]>([]);
  filterCity = signal<string>('Todas');
  filterTimeOfDay = signal<string | null>(null);
  filterModality = signal<string | null>(null);
  filterRecurrence = signal<string | null>(null);

  readonly categories = signal<CategoryCatalogItem[]>([]);
  readonly experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  readonly cities = signal<CityResponse[]>([]);

  whenOptions = ['Hoy', 'Mañana', 'Este finde', 'Esta semana', 'Próxima semana'];
  timeOptions = [
    { label: 'Mañana', sub: '6h - 12h' },
    { label: 'Mediodía', sub: '12h - 16h' },
    { label: 'Tarde', sub: '16h - 20h' },
    { label: 'Noche', sub: '20h - 24h' },
  ];
  modalityOptions = ['Presencial', 'Online'];
  recurrenceOptions = ['Único', 'Recurrente'];

  constructor() {
    this.refreshCatalogs();
  }

  get categoryOptions(): string[] {
    return this.categories().map(category => category.name);
  }

  get typeOptions(): string[] {
    return this.experienceTypes().map(type => type.name);
  }

  get cityOptions(): string[] {
    return ['Todas', ...this.cities().map(city => city.name)];
  }

  get activeFilterCount(): number {
    return (
      (this.filterWhen() ? 1 : 0) +
      this.filterCategories().length +
      this.filterTypes().length +
      (this.filterCity() !== 'Todas' ? 1 : 0) +
      (this.filterTimeOfDay() ? 1 : 0) +
      (this.filterModality() ? 1 : 0) +
      (this.filterRecurrence() ? 1 : 0)
    );
  }

  refreshCatalogs(): void {
    if (!this.isBrowser) return;

    this.catalogApi.getCategories().subscribe({
      next: categories => {
        const active = categories.filter(category => category.active);
        this.categories.set(active);
        this.filterCategories.update(selected =>
          selected.filter(name => active.some(category => category.name === name))
        );
      },
      error: () => undefined,
    });
    this.catalogApi.getExperienceTypes().subscribe({
      next: types => {
        const active = types.filter(type => type.active);
        this.experienceTypes.set(active);
        this.filterTypes.update(selected =>
          selected.filter(name => active.some(type => type.name === name))
        );
      },
      error: () => undefined,
    });
    this.cityApi.getCities().subscribe({
      next: cities => {
        const active = cities.filter(city => city.active);
        this.cities.set(active);
        if (this.filterCity() !== 'Todas' && !active.some(city => city.name === this.filterCity())) {
          this.filterCity.set('Todas');
        }
      },
      error: () => undefined,
    });
  }

  getCityByName(name: string): CityResponse | undefined {
    return this.cities().find(city => city.name === name);
  }

  selectWhen(option: string): void {
    this.filterWhen.set(this.filterWhen() === option ? null : option);
  }

  toggleCategory(category: string): void {
    const selected = this.filterCategories();
    this.filterCategories.set(
      selected.includes(category)
        ? selected.filter(item => item !== category)
        : [...selected, category]
    );
  }

  toggleType(type: string): void {
    const selected = this.filterTypes();
    this.filterTypes.set(
      selected.includes(type)
        ? selected.filter(item => item !== type)
        : [...selected, type]
    );
  }

  selectCity(city: string): void {
    this.filterCity.set(city);
  }

  selectTimeOfDay(value: string): void {
    this.filterTimeOfDay.set(this.filterTimeOfDay() === value ? null : value);
  }

  selectModality(value: string): void {
    this.filterModality.set(this.filterModality() === value ? null : value);
  }

  selectRecurrence(value: string): void {
    this.filterRecurrence.set(this.filterRecurrence() === value ? null : value);
  }

  clearFilters(): void {
    this.filterWhen.set(null);
    this.filterCategories.set([]);
    this.filterTypes.set([]);
    this.filterCity.set('Todas');
    this.filterTimeOfDay.set(null);
    this.filterModality.set(null);
    this.filterRecurrence.set(null);
  }
}
