import { EventTravelComponent, LocationNoticeComponent } from '../../../shared/components/event-travel/event-travel.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, Subscription } from 'rxjs';

import { EventosService } from '../../../services/eventos.service';
import { FiltrosService } from '../../../services/filtros.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';

import {
  CategoryResponse,
  EventCardResponse,
  EventFilterParams,
  EventModality,
  EventMood
} from '../../../shared/models/evento.model';
import { ExperienceTypeCatalogItem } from '../../../shared/models/event-catalog.model';
import { RecommendationFilterParams } from '../../../shared/models/recommendation.model';
import { categoryIcon } from '../../../shared/utils/category-icon.util';
import { EventsMapPanelComponent } from './events-map-panel.component';
import { AdvancedEventFiltersComponent } from './advanced-event-filters.component';

interface EventSortOption {
  label: string;
  sort: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  currentMonth: boolean;
  dateKey: string;
}

interface CatalogPage {
  events: EventCardResponse[];
  reasons: Record<number, string>;
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [EventTravelComponent, LocationNoticeComponent, CommonModule, RouterLink, EventsMapPanelComponent, AdvancedEventFiltersComponent],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Eventos {
  private readonly eventosService = inject(EventosService);
  private readonly filtrosService = inject(FiltrosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);

  searchQuery = signal('');
  readonly catalogView = signal<'grid' | 'map'>('grid');
  readonly mapFilters = computed(() => this.buildFilters());

  setCatalogView(view: 'grid' | 'map'): void {
    this.showSortMenu.set(false);
    this.catalogView.set(view);
  }

  eventos = signal<EventCardResponse[]>([]);
  categorias = signal<CategoryResponse[]>([]);
  experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);

  totalEventos = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);

  loading = signal(false);
  error = signal<string | null>(null);

  recommendationReasons = signal<Record<number, string>>({});

  readonly favoritos = this.favoritesService.favoritedEventIds;

  showFavoriteLoginCard = signal(false);
  showDatePicker = signal(false);
  showSortMenu = signal(false);
  expandedDescription = signal(false);

  customDateFrom = signal(this.toDateParam(new Date()));
  customDateTo = signal(this.toDateParam(new Date()));

  calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  calendarDays = signal<CalendarDay[]>([]);
  selectedCalendarStart = signal<string | null>(null);
  selectedCalendarEnd = signal<string | null>(null);
  calendarSelectionMode = signal<'quick' | 'custom'>('quick');

  readonly skeletonCards = Array.from({ length: 8 });

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';

  readonly sortOptions: EventSortOption[] = [
    {
      label: 'Fecha más próxima',
      sort: 'startsAt,asc',
    },
    {
      label: 'Recién añadidos',
      sort: 'createdAt,desc',
    },
    {
      label: 'Precio (de menor a mayor)',
      sort: 'priceFrom,asc',
    },
    {
      label: 'Precio (de mayor a menor)',
      sort: 'priceFrom,desc',
    },
  ];

  readonly recommendationSort: EventSortOption = {
    label: 'Recomendados para ti',
    sort: 'recommended',
  };

  readonly canUseRecommendations = computed(() => {
    const roles = this.authService.currentUser()?.roles ?? [];

    return roles.includes('ROLE_USER') || roles.includes('USER');
  });

  readonly availableSortOptions = computed(() =>
    this.canUseRecommendations()
      ? [this.recommendationSort, ...this.sortOptions]
      : this.sortOptions,
  );

  selectedSort = signal<EventSortOption>(this.recommendationSort);

  readonly effectiveSort = computed(() => {
    const selected = this.selectedSort();

    if (selected.sort === 'recommended' && !this.canUseRecommendations()) {
      return this.sortOptions[0];
    }

    return selected;
  });

  private readonly recommendationVersion = signal(0);
  private lastCriteriaKey = '';

  constructor() {
    this.generateCalendar();
    this.loadCategorias();
    this.loadExperienceTypes();

    this.searchQuery.set(this.route.snapshot.queryParamMap.get('q') ?? '');

    effect((onCleanup) => {
      const filters = this.buildFilters();
      const session = this.authService.currentUser();

      const useRecommendations =
        this.effectiveSort().sort === 'recommended' && this.canUseRecommendations();

      this.recommendationVersion();

      const criteriaKey = JSON.stringify({
        ...filters,
        page: undefined,
        userId: session?.id ?? null,
        useRecommendations,
      });

      const criteriaChanged = criteriaKey !== this.lastCriteriaKey;
      this.lastCriteriaKey = criteriaKey;

      let cancelled = false;
      let request: Subscription | undefined;

      onCleanup(() => {
        cancelled = true;
        request?.unsubscribe();
      });

      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        if (criteriaChanged && (filters.page ?? 0) !== 0) {
          this.eventos.set([]);
          this.recommendationReasons.set({});
          this.currentPage.set(0);
          return;
        }

        request = this.loadEventos(filters, useRecommendations);
      });
    });
  }

  // Acceso y búsqueda

  cerrarFavoriteLoginCard(): void {
    this.showFavoriteLoginCard.set(false);
  }

  irAAuthLogin(): void {
    this.showFavoriteLoginCard.set(false);

    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: '/explorar',
      },
    });
  }

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  // Filtros compartidos

  get filterWhen() {
    return this.filtrosService.filterWhen;
  }

  get filterCategories() {
    return this.filtrosService.filterCategories;
  }

  get filterTypes() {
    return this.filtrosService.filterTypes;
  }

  get filterCity() {
    return this.filtrosService.filterCity;
  }

  get filterTimeOfDay() {
    return this.filtrosService.filterTimeOfDay;
  }

  get filterModality() {
    return this.filtrosService.filterModality;
  }

  get filterRecurrence() {
    return this.filtrosService.filterRecurrence;
  }

  get activeFilterCount(): number {
    return this.filtrosService.activeFilterCount;
  }

  get filterMood(){
    return this.filtrosService.filterMood;
  }

  openHeaderFilter(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:open-filter'));
    }
  }

  selectWhen(option: string): void {
    if (
      option === 'Esta semana' ||
      option === 'Este finde' ||
      option === 'Próxima semana' ||
      option === 'Proxima semana'
    ) {
      this.selectQuickCalendarRange(option === 'Proxima semana' ? 'Próxima semana' : option);
      return;
    }

    this.showDatePicker.set(false);
    this.filtrosService.selectWhen(option);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('oona:select-when', {
          detail: option,
        }),
      );
    }
  }

  selectMood(option: string): void {
    this.filtrosService.selectMood(option);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:select-mood', {
        detail: this.filterMood(),
      }));
    }
  }

  clearFilters(): void {
    this.showDatePicker.set(false);
    this.selectedCalendarStart.set(null);
    this.selectedCalendarEnd.set(null);
    this.filtrosService.clearFilters();
  }

  // Calendario

  toggleDatePicker(): void {
    this.showDatePicker.update((value) => !value);

    if (!this.showDatePicker()) {
      return;
    }

    this.generateCalendar();

    const currentFilter = this.filterWhen();

    if (currentFilter?.startsWith('RANGO:')) {
      const [, from, to] = currentFilter.split(':');

      this.selectedCalendarStart.set(from);
      this.selectedCalendarEnd.set(to);
      this.calendarSelectionMode.set('custom');
    } else {
      this.syncQuickRangeWithFilter();
    }
  }

  closeDatePicker(): void {
    this.showDatePicker.set(false);
  }

  previousMonth(): void {
    const current = this.calendarMonth();

    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));

    this.generateCalendar();
  }

  nextMonth(): void {
    const current = this.calendarMonth();

    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));

    this.generateCalendar();
  }

  private generateCalendar(): void {
    const month = this.calendarMonth();

    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);

    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    let mondayOffset = firstDay.getDay() - 1;

    if (mondayOffset < 0) {
      mondayOffset = 6;
    }

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - mondayOffset);

    let sundayOffset = 7 - lastDay.getDay();

    if (sundayOffset === 7) {
      sundayOffset = 0;
    }

    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + sundayOffset);

    const days: CalendarDay[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      days.push({
        date: new Date(cursor),
        dayNumber: cursor.getDate(),
        currentMonth: cursor.getMonth() === month.getMonth(),
        dateKey: this.toDateParam(cursor),
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    this.calendarDays.set(days);
  }

  calendarMonthLabel(): string {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    })
      .format(this.calendarMonth())
      .replace(/^./, (char) => char.toUpperCase());
  }

  isToday(day: CalendarDay): boolean {
    return day.dateKey === this.toDateParam(new Date());
  }

  isPastDay(day: CalendarDay): boolean {
    return day.dateKey < this.toDateParam(new Date());
  }

  selectCalendarDay(day: CalendarDay): void {
    if (this.isPastDay(day)) {
      return;
    }

    const date = day.dateKey;
    const start = this.selectedCalendarStart();
    const end = this.selectedCalendarEnd();

    this.calendarSelectionMode.set('custom');

    if (!start || (start && end)) {
      this.selectedCalendarStart.set(date);
      this.selectedCalendarEnd.set(null);
      return;
    }

    if (date < start) {
      this.selectedCalendarStart.set(date);
      this.selectedCalendarEnd.set(start);
    } else {
      this.selectedCalendarEnd.set(date);
    }
  }

  isRangeStart(day: CalendarDay): boolean {
    return day.dateKey === this.selectedCalendarStart();
  }

  isRangeEnd(day: CalendarDay): boolean {
    return day.dateKey === this.selectedCalendarEnd();
  }

  isRangeMiddle(day: CalendarDay): boolean {
    const start = this.selectedCalendarStart();
    const end = this.selectedCalendarEnd();

    if (!start || !end) {
      return false;
    }

    return day.dateKey > start && day.dateKey < end;
  }

  isInSelectedRange(day: CalendarDay): boolean {
    const start = this.selectedCalendarStart();
    const end = this.selectedCalendarEnd();

    if (!start) {
      return false;
    }

    if (!end) {
      return day.dateKey === start;
    }

    return day.dateKey >= start && day.dateKey <= end;
  }

  selectQuickCalendarRange(option: string): void {
    const today = new Date();

    let start: Date;
    let end: Date;

    if (option === 'Este finde') {
      const day = today.getDay();

      let daysUntilSaturday = day === 6 ? 0 : 6 - day;

      if (day === 0) {
        daysUntilSaturday = -1;
      }

      start = new Date(today);
      start.setDate(today.getDate() + daysUntilSaturday);

      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else if (option === 'Esta semana') {
      start = new Date(today);

      const day = today.getDay();
      const daysUntilSunday = day === 0 ? 0 : 7 - day;

      end = new Date(today);
      end.setDate(today.getDate() + daysUntilSunday);
    } else {
      start = this.getMonday(today);
      start.setDate(start.getDate() + 7);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    const startKey = this.toDateParam(start);
    const endKey = this.toDateParam(end);

    this.selectedCalendarStart.set(startKey);
    this.selectedCalendarEnd.set(endKey);
    this.calendarSelectionMode.set('quick');

    this.filtrosService.filterWhen.set(`RANGO:${startKey}:${endKey}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('oona:select-when', {
          detail: option,
        }),
      );
    }
  }

  private syncQuickRangeWithFilter(): void {
    const current = this.filterWhen();

    if (
      current === 'Esta semana' ||
      current === 'Este finde' ||
      current === 'Próxima semana' ||
      current === 'Proxima semana'
    ) {
      this.selectQuickCalendarRange(current);
      return;
    }

    this.selectedCalendarStart.set(null);
    this.selectedCalendarEnd.set(null);
  }

  applyCustomDateRange(): void {
    const start = this.selectedCalendarStart();
    const end = this.selectedCalendarEnd();

    if (!start) {
      return;
    }

    const finalEnd = end || start;

    this.customDateFrom.set(start);
    this.customDateTo.set(finalEnd);

    this.filtrosService.filterWhen.set(`RANGO:${start}:${finalEnd}`);

    this.showDatePicker.set(false);
  }

  clearDateFilter(): void {
    this.selectedCalendarStart.set(null);
    this.selectedCalendarEnd.set(null);

    this.customDateFrom.set(this.toDateParam(new Date()));
    this.customDateTo.set(this.toDateParam(new Date()));

    this.filtrosService.filterWhen.set(null);
    this.showDatePicker.set(false);
  }

  updateCustomDateFrom(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customDateFrom.set(value);
  }

  updateCustomDateTo(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customDateTo.set(value);
  }

  isCustomDateActive(): boolean {
    return this.filterWhen()?.startsWith('RANGO:') ?? false;
  }

  customDateLabel(): string {
    if (!this.isCustomDateActive()) {
      return 'Elegir fecha';
    }

    const [, from, to] = this.filterWhen()?.split(':') ?? [];

    return from === to
      ? this.formatShortDate(from)
      : `${this.formatShortDate(from)} - ${this.formatShortDate(to)}`;
  }

  // Orden y paginación

  toggleSortMenu(): void {
    this.showSortMenu.update((value) => !value);
  }

  selectSort(option: EventSortOption): void {
    this.selectedSort.set(option);
    this.showSortMenu.set(false);
  }

  goToPage(page: number): void {
    if (this.loading() || !Number.isInteger(page) || page < 0 || page >= this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  toggleDescription(): void {
    this.expandedDescription.update((value) => !value);
  }

  // Favoritos

  toggleFavorito(item: EventCardResponse): void {
    if (!this.authService.isLoggedIn) {
      this.showFavoriteLoginCard.set(true);
      return;
    }

    this.favoritesService.toggleFavorite('EVENTO', item.id).subscribe({
      next: () => {
        if (this.effectiveSort().sort === 'recommended') {
          this.recommendationVersion.update((value) => value + 1);
        }
      },
      error: (error) => {
        console.error('Error toggling favorite', error);
      },
    });
  }

  isFavorito(item: EventCardResponse): boolean {
    return this.favoritos().has(item.id);
  }

  // Presentación

  categoryEmoji(name: string | null): string {
    return categoryIcon(name);
  }

  isOnline(item: EventCardResponse): boolean {
    return item.modality === EventModality.ONLINE;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatPrice(item: EventCardResponse): string {
    if (item.priceFrom === null || item.priceFrom === undefined) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: item.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(item.priceFrom);
  }

  assetUrl(url: string | null | undefined, fallback = this.fallbackImage): string {
    return this.eventosService.resolveAssetUrl(url) ?? fallback;
  }

  private getMonday(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);

    return result;
  }

  private toDateParam(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatShortDate(value: string | undefined): string {
    if (!value) {
      return 'Fecha';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(`${value}T00:00:00`));
  }

  // Consultas al backend

  private loadCategorias(): void {
    this.eventosService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias.filter((categoria) => categoria.active));
      },
      error: () => {
        this.categorias.set([]);
      },
    });
  }

  private loadExperienceTypes(): void {
    this.eventosService.getExperienceTypes().subscribe({
      next: (types) => {
        this.experienceTypes.set(types);
      },
      error: () => {
        this.experienceTypes.set([]);
      },
    });
  }

  private loadEventos(filters: EventFilterParams, useRecommendations: boolean): Subscription {
    this.loading.set(true);
    this.error.set(null);
    this.eventos.set([]);
    this.recommendationReasons.set({});
    this.totalEventos.set(0);
    this.totalPages.set(0);

    let request$: Observable<CatalogPage>;

    if (useRecommendations) {
      const recommendationFilters: RecommendationFilterParams = {
        search: filters.search,
        categoryId: filters.categoryId,
        categoryIds: filters.categoryIds,
        experienceTypeId: filters.experienceTypeId,
        modality: filters.modality,
        cityName: filters.cityName,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        hourFrom: filters.hourFrom,
        hourTo: filters.hourTo,
        isRecurring: filters.isRecurring,
        specialistId: filters.specialistId,
        mood: filters.mood,
        useProfileCity: false,
        includeOnline: true,
      };

      request$ = this.eventosService
        .getRecommendedEventos(filters.page ?? 0, filters.size ?? 24, recommendationFilters)
        .pipe(
          map((page) => {
            const reasons: Record<number, string> = {};

            for (const item of page.content) {
              if (item.score > 0) {
                reasons[item.event.id] = item.reason;
              }
            }

            return {
              events: page.content.map((item) => item.event),
              reasons,
              totalElements: page.totalElements,
              totalPages: page.totalPages,
            };
          }),
        );
    } else {
      request$ = this.eventosService.getEventos(filters).pipe(
        map((page) => ({
          events: page.content,
          reasons: {},
          totalElements: page.totalElements,
          totalPages: page.totalPages,
        })),
      );
    }

    return request$.subscribe({
      next: (page) => {
        this.eventos.set(page.events);
        this.recommendationReasons.set(page.reasons);
        this.totalEventos.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.eventos.set([]);
        this.recommendationReasons.set({});
        this.totalEventos.set(0);
        this.totalPages.set(0);

        this.error.set(
          error.status === 401 || error.status === 403
            ? 'Inicia sesión con una cuenta de usuario para consultar recomendaciones.'
            : 'No pudimos cargar los eventos. Inténtalo nuevamente.',
        );

        this.loading.set(false);
      },
    });
  }

  private buildFilters(): EventFilterParams {
    const categoryIds = this.filterCategories()
      .map((name) => this.categoryIdFor(name))
      .filter((id): id is number => id !== undefined);

    return {
      page: this.currentPage(),
      specialistId: this.filtrosService.filterSpecialistId() ?? undefined,
      size: 24,

      search: this.searchQuery().trim() || undefined,

      ...this.dateRangeFor(this.filterWhen()),
      ...this.timeRangeFor(this.filterTimeOfDay()),
      ...this.filtrosService.priceRangeFor(this.filtrosService.filterPrice()),

      categoryIds: categoryIds.length ? categoryIds : undefined,

      experienceTypeId: this.experienceTypeIdFor(this.filterTypes()[0]),

      cityName: this.filterCity() !== 'Todas' ? this.filterCity() : undefined,

      modality: this.modalityFor(this.filterModality()),

      isRecurring: this.recurrenceFor(this.filterRecurrence()),

      sort: this.effectiveSort().sort === 'recommended' ? undefined : this.effectiveSort().sort,
      mood: this.moodFor(this.filterMood()),
    };
  }

  private categoryIdFor(name: string | undefined): number | undefined {
    return this.categorias().find((categoria) => categoria.name === name)?.id;
  }

  private modalityFor(value: string | null): EventModality | undefined {
    if (!value) {
      return undefined;
    }

    if (value === 'Híbrida' || value.toUpperCase() === 'HIBRIDA') return EventModality.HIBRIDA;
    return value.toLowerCase() === 'online' ? EventModality.ONLINE : EventModality.PRESENCIAL;
  }

  private recurrenceFor(value: string | null): boolean | undefined {
    if (!value) {
      return undefined;
    }

    return value === 'Recurrente';
  }

  private experienceTypeIdFor(value: string | undefined): number | undefined {
    return this.experienceTypes().find((type) => type.name === value)?.id;
  }

  private timeRangeFor(value: string | null): Pick<EventFilterParams, 'hourFrom' | 'hourTo'> {
    const ranges: Record<string, Pick<EventFilterParams, 'hourFrom' | 'hourTo'>> = {
      Manana: { hourFrom: 6, hourTo: 12 },
      Mañana: { hourFrom: 6, hourTo: 12 },
      Mediodia: { hourFrom: 12, hourTo: 16 },
      Mediodía: { hourFrom: 12, hourTo: 16 },
      Tarde: { hourFrom: 16, hourTo: 20 },
      Noche: { hourFrom: 20, hourTo: 23 },
    };

    return value ? (ranges[value] ?? {}) : {};
  }

  private moodFor(value: string | null): EventMood | undefined {
    const key = value?.trim().toUpperCase();
    return Object.values(EventMood).find(mood => mood === key);
  }

  private dateRangeFor(value: string | null): Pick<EventFilterParams, 'dateFrom' | 'dateTo'> {
    if (!value) {
      return {};
    }

    if (value.startsWith('RANGO:')) {
      const [, dateFrom, dateTo] = value.split(':');

      return {
        dateFrom,
        dateTo: dateTo || dateFrom,
      };
    }

    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (value === 'Mañana' || value === 'Manana') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 1);
    } else if (value === 'Este finde') {
      const day = today.getDay();

      let daysUntilSaturday = day === 6 ? 0 : 6 - day;

      if (day === 0) {
        daysUntilSaturday = -1;
      }

      start.setDate(today.getDate() + daysUntilSaturday);

      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else if (value === 'Esta semana') {
      start = new Date(today);

      const day = today.getDay();
      const daysUntilSunday = day === 0 ? 0 : 7 - day;

      end = new Date(today);
      end.setDate(today.getDate() + daysUntilSunday);
    } else if (value === 'Próxima semana' || value === 'Proxima semana') {
      start = this.getMonday(today);
      start.setDate(start.getDate() + 7);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    return {
      dateFrom: this.toDateParam(start),
      dateTo: this.toDateParam(end),
    };
  }
}
