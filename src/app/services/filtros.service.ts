import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  CategoryCatalogItem,
  ExperienceTypeCatalogItem,
} from '../shared/models/event-catalog.model';
import { CityResponse, EventFilterParams, EventModality } from '../shared/models/evento.model';
import { EventCatalogService } from './event-catalog.service';
import { CityService } from './city.service';

export interface FiltrosEstado {
  when: string | null;
  categories: string[];
  types: string[];
  city: string;
  timeOfDay: string | null;
  modality: string | null;
  recurrence: string | null;
  price: string | null;
}

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
  filterPrice = signal<string | null>(null);

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

  /** Pills de precio (mismo diseño que el resto de chips del modal). */
  priceOptions = ['Gratis', 'Hasta 15€', '15–30€', '30–50€', 'Más de 50€'];

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
      (this.filterRecurrence() ? 1 : 0) +
      (this.filterPrice() ? 1 : 0)
    );
  }

  /** Estado aplicado actual de los filtros. */
  snapshot(): FiltrosEstado {
    return {
      when: this.filterWhen(),
      categories: [...this.filterCategories()],
      types: [...this.filterTypes()],
      city: this.filterCity(),
      timeOfDay: this.filterTimeOfDay(),
      modality: this.filterModality(),
      recurrence: this.filterRecurrence(),
      price: this.filterPrice(),
    };
  }

  /** Aplica un estado completo (lo usa el modal del header). */
  applySnapshot(state: FiltrosEstado): void {
    this.filterWhen.set(state.when);
    this.filterCategories.set([...state.categories]);
    this.filterTypes.set([...state.types]);
    this.filterCity.set(state.city);
    this.filterTimeOfDay.set(state.timeOfDay);
    this.filterModality.set(state.modality);
    this.filterRecurrence.set(state.recurrence);
    this.filterPrice.set(state.price);
  }

  /**
   * Convierte un estado de filtros (aplicado o pendiente) en los parámetros
   * que espera GET /api/v1/events. Lo comparten el modal del header (para el
   * contador de resultados en vivo) y la pestaña Explorar, de modo que el
   * número del botón y el listado siempre se construyan igual.
   */
  buildEventFilterParams(state: FiltrosEstado): EventFilterParams {
    return {
      ...this.priceRangeFor(state.price),
      ...this.dateRangeFor(state.when),
      ...this.timeRangeFor(state.timeOfDay),
      categoryIds: this.categoryIdsFor(state.categories),
      experienceTypeId: this.experienceTypeIdFor(state.types[0]),
      cityName: state.city !== 'Todas' ? state.city : undefined,
      modality: this.modalityFor(state.modality),
      isRecurring: this.recurrenceFor(state.recurrence),
    };
  }

  /** Rango de precio de cada pill (el backend filtra sobre priceFrom). */
  priceRangeFor(value: string | null): Pick<EventFilterParams, 'minPrice' | 'maxPrice'> {
    switch (value) {
      case 'Gratis':     return { minPrice: 0, maxPrice: 0 };
      case 'Hasta 15€':  return { maxPrice: 15 };
      case '15–30€':     return { minPrice: 15, maxPrice: 30 };
      case '30–50€':     return { minPrice: 30, maxPrice: 50 };
      case 'Más de 50€': return { minPrice: 50 };
      default:           return {};
    }
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

  selectPrice(value: string): void {
    this.filterPrice.set(this.filterPrice() === value ? null : value);
  }

  clearFilters(): void {
    this.filterWhen.set(null);
    this.filterCategories.set([]);
    this.filterTypes.set([]);
    this.filterCity.set('Todas');
    this.filterTimeOfDay.set(null);
    this.filterModality.set(null);
    this.filterRecurrence.set(null);
    this.filterPrice.set(null);
  }

  // ── Mapeo interno estado → parámetros de la API ──

  private categoryIdsFor(names: string[]): number[] | undefined {
    if (!names.length) return undefined;
    const available = this.categories();
    const ids = names
      .map(name => available.find(category => category.name === name)?.id)
      .filter((id): id is number => id !== undefined);
    return ids.length ? ids : undefined;
  }

  private experienceTypeIdFor(name: string | undefined): number | undefined {
    if (!name) return undefined;
    return this.experienceTypes().find(type => type.name === name)?.id;
  }

  private modalityFor(value: string | null): EventModality | undefined {
    if (!value) return undefined;
    if (value.toLowerCase() === 'online') return EventModality.ONLINE;
    return EventModality.PRESENCIAL;
  }

  private recurrenceFor(value: string | null): boolean | undefined {
    if (!value) return undefined;
    return value === 'Recurrente';
  }

  private timeRangeFor(value: string | null): Pick<EventFilterParams, 'hourFrom' | 'hourTo'> {
    const map: Record<string, Pick<EventFilterParams, 'hourFrom' | 'hourTo'>> = {
      'Manana': { hourFrom: 6, hourTo: 12 },
      'Mañana': { hourFrom: 6, hourTo: 12 },
      'Mediodia': { hourFrom: 12, hourTo: 16 },
      'Mediodía': { hourFrom: 12, hourTo: 16 },
      'Tarde': { hourFrom: 16, hourTo: 20 },
      'Noche': { hourFrom: 20, hourTo: 23 },
    };
    return value ? map[value] ?? {} : {};
  }

  private dateRangeFor(value: string | null): Pick<EventFilterParams, 'dateFrom' | 'dateTo'> {
    if (!value) return {};
    if (value.startsWith('RANGO:')) {
      const [, dateFrom, dateTo] = value.split(':');
      return {
        dateFrom,
        dateTo: dateTo || dateFrom,
      };
    }

    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    if (value === 'Hoy') {
    } else if (value === 'Mañana' || value === 'Manana') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 1);
    } else if (value === 'Este finde') {
      const day = today.getDay();
      const daysUntilSaturday = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
      start.setDate(today.getDate() + daysUntilSaturday);
      end.setDate(start.getDate() + 1);
    } else if (value === 'Esta semana') {
      end.setDate(today.getDate() + 7);
    } else if (value === 'Próxima semana' || value === 'Proxima semana') {
      start.setDate(today.getDate() + 7);
      end.setDate(today.getDate() + 14);
    }

    return {
      dateFrom: this.toDateParam(start),
      dateTo: this.toDateParam(end),
    };
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}