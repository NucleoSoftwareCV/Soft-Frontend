import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventosService } from '../../../services/eventos.service';
import { FiltrosService } from '../../../services/filtros.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CategoryResponse,
  EventCardResponse,
  EventFilterParams,
  EventModality,
} from '../../../shared/models/evento.model';
import { ExperienceTypeCatalogItem } from '../../../shared/models/event-catalog.model';
import { EventoCardComponent } from '../../../shared/components/event-card/event-card';

interface EventSortOption {
  label: string;
  sort: string;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, EventoCardComponent],
  
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class Eventos {
  private readonly eventosService = inject(EventosService);
  private readonly filtrosService = inject(FiltrosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  searchQuery = signal<string>('');
  eventos = signal<EventCardResponse[]>([]);
  categorias = signal<CategoryResponse[]>([]);
  experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);
  totalEventos = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  
  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);
  readonly favoritos = this.favoritesService.favoritedEventIds;

  showDatePicker = signal(false);
  showSortMenu = signal(false);
  expandedDescription = signal(false);
  customDateFrom = signal(this.toDateParam(new Date()));
  customDateTo = signal(this.toDateParam(new Date()));

  readonly skeletonCards = Array.from({ length: 8 });
  readonly fallbackImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';
  readonly sortOptions: EventSortOption[] = [
    { label: 'Fecha más próxima', sort: 'startsAt,asc' },
    { label: 'Recién añadidos', sort: 'createdAt,desc' },
    { label: 'Precio (de menor a mayor)', sort: 'priceFrom,asc' },
    { label: 'Precio (de mayor a menor)', sort: 'priceFrom,desc' },
  ];
  selectedSort = signal<EventSortOption>(this.sortOptions[0]);
  private lastRequestKey = '';

  constructor() {
    this.loadCategorias();
    this.loadExperienceTypes();
    this.searchQuery.set(this.route.snapshot.queryParamMap.get('q') ?? '');

    effect(() => {
      const criteria = {
        categoryCatalog: this.categorias().map(category => category.id).join('|'),
        when: this.filterWhen(),
        categories: this.filterCategories().join('|'),
        types: this.filterTypes().join('|'),
        city: this.filterCity(),
        timeOfDay: this.filterTimeOfDay(),
        modality: this.filterModality(),
        recurrence: this.filterRecurrence(),
        search: this.searchQuery(),
        sort: this.selectedSort().sort,
      };

      queueMicrotask(() => this.loadEventos(criteria));
    });
  }

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  get filterWhen()       { return this.filtrosService.filterWhen; }
  get filterCategories() { return this.filtrosService.filterCategories; }
  get filterTypes()      { return this.filtrosService.filterTypes; }
  get filterCity()       { return this.filtrosService.filterCity; }
  get filterTimeOfDay()  { return this.filtrosService.filterTimeOfDay; }
  get filterModality()   { return this.filtrosService.filterModality; }
  get filterRecurrence() { return this.filtrosService.filterRecurrence; }
  get activeFilterCount(): number { return this.filtrosService.activeFilterCount; }

  openHeaderFilter() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:open-filter'));
    }
  }

  selectWhen(option: string) {
    this.showDatePicker.set(false);
    this.filtrosService.selectWhen(option);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:select-when', { detail: option }));
    }
  }

  toggleDatePicker(): void {
    this.showDatePicker.update(value => !value);
  }

  updateCustomDateFrom(event: Event): void {
    this.customDateFrom.set((event.target as HTMLInputElement).value);
  }

  updateCustomDateTo(event: Event): void {
    this.customDateTo.set((event.target as HTMLInputElement).value);
  }

  applyCustomDateRange(): void {
    const from = this.customDateFrom();
    const to = this.customDateTo() || from;
    this.filtrosService.filterWhen.set(`RANGO:${from}:${to}`);
    this.showDatePicker.set(false);
  }

  clearDateFilter(): void {
    this.filtrosService.filterWhen.set(null);
    this.showDatePicker.set(false);
  }

  toggleSortMenu(): void {
    this.showSortMenu.update(value => !value);
  }

  selectSort(option: EventSortOption): void {
    this.selectedSort.set(option);
    this.showSortMenu.set(false);
  }

  toggleDescription(): void {
    this.expandedDescription.update(value => !value);
  }

  isCustomDateActive(): boolean {
    return this.filterWhen()?.startsWith('RANGO:') ?? false;
  }

  customDateLabel(): string {
    if (!this.isCustomDateActive()) return 'Elegir fecha';
    const [, from, to] = this.filterWhen()?.split(':') ?? [];
    return from === to ? this.formatShortDate(from) : `${this.formatShortDate(from)} - ${this.formatShortDate(to)}`;
  }

  clearFilters() {
    this.showDatePicker.set(false);
    this.filtrosService.clearFilters();
  }

  private loadCategorias(): void {
    this.eventosService.getCategorias().subscribe({
      next: categorias => this.categorias.set(categorias.filter(categoria => categoria.active)),
      error: () => this.categorias.set([]),
    });
  }

  private loadEventos(criteria: Record<string, string | null>): void {
    const requestKey = JSON.stringify(criteria);
    if (requestKey === this.lastRequestKey) return;
    this.lastRequestKey = requestKey;

    this.loading.set(true);
    this.error.set(null);

    this.eventosService.getEventos(this.buildFilters()).subscribe({
      next: page => {
        this.eventos.set(page.content ?? []);
        this.totalEventos.set(page.totalElements ?? page.content?.length ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.eventos.set([]);
        this.totalEventos.set(0);
        this.error.set('El backend no está disponible en este momento. No se pueden mostrar eventos reales.');
        this.loading.set(false);
      },
    });
  }

  private buildFilters(): EventFilterParams {
    return {
      size: 24,
      search: this.searchQuery().trim() || undefined,
      ...this.dateRangeFor(this.filterWhen()),
      ...this.timeRangeFor(this.filterTimeOfDay()),
      categoryId: this.categoryIdFor(this.filterCategories()[0]),
      experienceTypeId: this.experienceTypeIdFor(this.filterTypes()[0]),
      cityName: this.filterCity() !== 'Todas' ? this.filterCity() : undefined,
      modality: this.modalityFor(this.filterModality()),
      isRecurring: this.recurrenceFor(this.filterRecurrence()),
      sort: this.selectedSort().sort,
    };
  }

  private categoryIdFor(name: string | undefined): number | undefined {
    return this.categorias().find(categoria => categoria.name === name)?.id;
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

  private experienceTypeIdFor(value: string | undefined): number | undefined {
    return this.experienceTypes().find(type => type.name === value)?.id;
  }

  private loadExperienceTypes(): void {
    this.eventosService.getExperienceTypes().subscribe({
      next: types => {
        this.experienceTypes.set(types);
      },
      error: () => this.experienceTypes.set([]),
    });
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

    if (value === 'Mañana' || value === 'Manana') {
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

  private formatShortDate(value: string | undefined): string {
    if (!value) return 'Fecha';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(`${value}T00:00:00`));
  }
}
