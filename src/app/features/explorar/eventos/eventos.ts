import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { EventosService } from '../../../services/eventos.service';
import { FiltrosService } from '../../../services/filtros.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';

import {
  CategoryResponse,
  EventCardResponse,
  EventFilterParams,
  EventModality
} from '../../../shared/models/evento.model';

import { categoryIcon } from '../../../shared/utils/category-icon.util';
import { ExperienceTypeCatalogItem } from '../../../shared/models/event-catalog.model';

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

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Eventos {

  private readonly eventosService = inject(EventosService);
  private readonly filtrosService = inject(FiltrosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);

  searchQuery = signal<string>('');

  eventos = signal<EventCardResponse[]>([]);
  categorias = signal<CategoryResponse[]>([]);
  experienceTypes = signal<ExperienceTypeCatalogItem[]>([]);

  totalEventos = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly favoritos =
    this.favoritesService.favoritedEventIds;

  showFavoriteLoginCard = signal(false);

  showDatePicker = signal(false);
  showSortMenu = signal(false);
  expandedDescription = signal(false);

  customDateFrom =
    signal(this.toDateParam(new Date()));

  customDateTo =
    signal(this.toDateParam(new Date()));

  /*
   * =====================================================
   * CALENDARIO
   * =====================================================
   */

  calendarMonth = signal(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
  );

  calendarDays =
    signal<CalendarDay[]>([]);

  selectedCalendarStart =
    signal<string | null>(null);

  selectedCalendarEnd =
    signal<string | null>(null);

  calendarSelectionMode =
    signal<'quick' | 'custom'>('quick');

  readonly skeletonCards =
    Array.from({ length: 8 });

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';

  readonly sortOptions: EventSortOption[] = [
    {
      label: 'Fecha más próxima',
      sort: 'startsAt,asc'
    },
    {
      label: 'Recién añadidos',
      sort: 'createdAt,desc'
    },
    {
      label: 'Precio (de menor a mayor)',
      sort: 'priceFrom,asc'
    },
    {
      label: 'Precio (de mayor a menor)',
      sort: 'priceFrom,desc'
    }
  ];

  selectedSort =
    signal<EventSortOption>(
      this.sortOptions[0]
    );

  private lastRequestKey = '';

  constructor() {

    this.generateCalendar();

    this.loadCategorias();
    this.loadExperienceTypes();

    this.searchQuery.set(
      this.route.snapshot.queryParamMap.get('q') ?? ''
    );

    effect(() => {

      const criteria = {

        categoryCatalog:
          this.categorias()
            .map(category => category.id)
            .join('|'),

        when:
          this.filterWhen(),

        categories:
          this.filterCategories()
            .join('|'),

        types:
          this.filterTypes()
            .join('|'),

        city:
          this.filterCity(),

        timeOfDay:
          this.filterTimeOfDay(),

        modality:
          this.filterModality(),

        recurrence:
          this.filterRecurrence(),

        search:
          this.searchQuery(),

        sort:
          this.selectedSort().sort
      };

      queueMicrotask(() => {
        this.loadEventos(criteria);
      });

    });
  }

  /*
   * =====================================================
   * FAVORITOS
   * =====================================================
   */

  cerrarFavoriteLoginCard(): void {
    this.showFavoriteLoginCard.set(false);
  }

  irAAuthLogin(): void {

    this.showFavoriteLoginCard.set(false);

    this.router.navigate(
      ['/auth/login'],
      {
        queryParams: {
          returnUrl: '/explorar'
        }
      }
    );
  }

  /*
   * =====================================================
   * BÚSQUEDA
   * =====================================================
   */

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  /*
   * =====================================================
   * FILTROS
   * =====================================================
   */

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

  openHeaderFilter(): void {

    if (typeof window !== 'undefined') {

      window.dispatchEvent(
        new CustomEvent(
          'oona:open-filter'
        )
      );

    }
  }

  selectWhen(option: string): void {

    if (option === 'Esta semana') {

      this.selectQuickCalendarRange(
        'Esta semana'
      );

      return;
    }

    if (option === 'Este finde') {

      this.selectQuickCalendarRange(
        'Este finde'
      );

      return;
    }

    if (
      option === 'Próxima semana' ||
      option === 'Proxima semana'
    ) {

      this.selectQuickCalendarRange(
        'Próxima semana'
      );

      return;
    }

    this.showDatePicker.set(false);

    this.filtrosService.selectWhen(
      option
    );

    if (typeof window !== 'undefined') {

      window.dispatchEvent(
        new CustomEvent(
          'oona:select-when',
          {
            detail: option
          }
        )
      );

    }
  }

  /*
   * =====================================================
   * CALENDARIO FLOTANTE
   * =====================================================
   */

  toggleDatePicker(): void {

    this.showDatePicker.update(
      value => !value
    );

    if (this.showDatePicker()) {

      this.generateCalendar();

      const currentFilter =
        this.filterWhen();

      if (
        currentFilter?.startsWith('RANGO:')
      ) {

        const [
          ,
          from,
          to
        ] =
          currentFilter.split(':');

        this.selectedCalendarStart.set(
          from
        );

        this.selectedCalendarEnd.set(
          to
        );

        this.calendarSelectionMode.set(
          'custom'
        );

      } else {

        this.syncQuickRangeWithFilter();
      }
    }
  }

  closeDatePicker(): void {
    this.showDatePicker.set(false);
  }

  /*
   * =====================================================
   * CAMBIAR MES
   * =====================================================
   */

  previousMonth(): void {

    const current =
      this.calendarMonth();

    this.calendarMonth.set(
      new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1
      )
    );

    this.generateCalendar();
  }

  nextMonth(): void {

    const current =
      this.calendarMonth();

    this.calendarMonth.set(
      new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1
      )
    );

    this.generateCalendar();
  }

  /*
   * =====================================================
   * GENERAR CALENDARIO
   *
   * LUNES -> DOMINGO
   * =====================================================
   */

  private generateCalendar(): void {

    const month =
      this.calendarMonth();

    const firstDay =
      new Date(
        month.getFullYear(),
        month.getMonth(),
        1
      );

    const lastDay =
      new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0
      );

    /*
     * Lunes = primer día
     */

    let mondayOffset =
      firstDay.getDay() - 1;

    if (mondayOffset < 0) {
      mondayOffset = 6;
    }

    const startDate =
      new Date(firstDay);

    startDate.setDate(
      firstDay.getDate() -
      mondayOffset
    );

    /*
     * Domingo = último día
     */

    let sundayOffset =
      7 - lastDay.getDay();

    if (sundayOffset === 7) {
      sundayOffset = 0;
    }

    const endDate =
      new Date(lastDay);

    endDate.setDate(
      lastDay.getDate() +
      sundayOffset
    );

    /*
     * Crear días
     */

    const days: CalendarDay[] = [];

    const cursor =
      new Date(startDate);

    while (cursor <= endDate) {

      days.push({

        date:
          new Date(cursor),

        dayNumber:
          cursor.getDate(),

        currentMonth:
          cursor.getMonth() ===
          month.getMonth(),

        dateKey:
          this.toDateParam(cursor)

      });

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    this.calendarDays.set(
      days
    );
  }

  calendarMonthLabel(): string {

    return new Intl.DateTimeFormat(
      'es-ES',
      {
        month: 'long',
        year: 'numeric'
      }
    )
      .format(
        this.calendarMonth()
      )
      .replace(
        /^./,
        char => char.toUpperCase()
      );
  }

  /*
   * =====================================================
   * HOY
   * =====================================================
   */

  isToday(
    day: CalendarDay
  ): boolean {

    return day.dateKey ===
      this.toDateParam(
        new Date()
      );
  }

  /*
   * =====================================================
   * DÍAS PASADOS
   *
   * NO CLICKEABLES
   * =====================================================
   */

  isPastDay(
    day: CalendarDay
  ): boolean {

    const today =
      this.toDateParam(
        new Date()
      );

    return day.dateKey < today;
  }

  /*
   * =====================================================
   * SELECCIONAR DÍA MANUALMENTE
   * =====================================================
   */

  selectCalendarDay(
    day: CalendarDay
  ): void {

    /*
     * No permitir seleccionar
     * días que ya pasaron
     */

    if (this.isPastDay(day)) {
      return;
    }

    const date =
      day.dateKey;

    this.calendarSelectionMode.set(
      'custom'
    );

    const start =
      this.selectedCalendarStart();

    const end =
      this.selectedCalendarEnd();

    /*
     * Primera selección
     * o empezar un nuevo rango
     */

    if (
      !start ||
      (start && end)
    ) {

      this.selectedCalendarStart.set(
        date
      );

      this.selectedCalendarEnd.set(
        null
      );

      return;
    }

    /*
     * Si selecciona una fecha
     * anterior al inicio,
     * invertir el rango
     */

    if (date < start) {

      this.selectedCalendarStart.set(
        date
      );

      this.selectedCalendarEnd.set(
        start
      );

    } else {

      this.selectedCalendarEnd.set(
        date
      );
    }
  }

  /*
   * =====================================================
   * CLASES VISUALES DEL RANGO
   * =====================================================
   */

  isRangeStart(
    day: CalendarDay
  ): boolean {

    return day.dateKey ===
      this.selectedCalendarStart();
  }

  isRangeEnd(
    day: CalendarDay
  ): boolean {

    return day.dateKey ===
      this.selectedCalendarEnd();
  }

  isRangeMiddle(
    day: CalendarDay
  ): boolean {

    const start =
      this.selectedCalendarStart();

    const end =
      this.selectedCalendarEnd();

    if (!start || !end) {
      return false;
    }

    return (
      day.dateKey > start &&
      day.dateKey < end
    );
  }

  isInSelectedRange(
    day: CalendarDay
  ): boolean {

    const start =
      this.selectedCalendarStart();

    const end =
      this.selectedCalendarEnd();

    if (!start) {
      return false;
    }

    if (!end) {
      return day.dateKey === start;
    }

    return (
      day.dateKey >= start &&
      day.dateKey <= end
    );
  }

  /*
   * =====================================================
   * SELECCIÓN RÁPIDA
   * =====================================================
   */

  selectQuickCalendarRange(
    option: string
  ): void {

    const today =
      new Date();

    let start: Date;
    let end: Date;

    /*
     * =================================================
     * ESTE FINDE
     *
     * SE MANTIENE IGUAL
     * =================================================
     */

    if (
      option === 'Este finde'
    ) {

      const day =
        today.getDay();

      let daysUntilSaturday =
        day === 6
          ? 0
          : 6 - day;

      if (day === 0) {
        daysUntilSaturday = -1;
      }

      start =
        new Date(today);

      start.setDate(
        today.getDate() +
        daysUntilSaturday
      );

      end =
        new Date(start);

      end.setDate(
        start.getDate() + 1
      );

    /*
     * =================================================
     * ESTA SEMANA
     *
     * HOY -> DOMINGO
     *
     * Lunes    = lunes -> domingo
     * Martes   = martes -> domingo
     * Miércoles = miércoles -> domingo
     * Jueves   = jueves -> domingo
     * Viernes  = viernes -> domingo
     * Sábado   = sábado -> domingo
     * Domingo  = domingo -> domingo
     * =================================================
     */

    } else if (
      option === 'Esta semana'
    ) {

      start =
        new Date(today);

      const day =
        today.getDay();

      const daysUntilSunday =
        day === 0
          ? 0
          : 7 - day;

      end =
        new Date(today);

      end.setDate(
        today.getDate() +
        daysUntilSunday
      );

    /*
     * =================================================
     * PRÓXIMA SEMANA
     *
     * LUNES -> DOMINGO
     * =================================================
     */

    } else {

      start =
        this.getMonday(today);

      start.setDate(
        start.getDate() + 7
      );

      end =
        new Date(start);

      end.setDate(
        start.getDate() + 6
      );
    }

    const startKey =
      this.toDateParam(start);

    const endKey =
      this.toDateParam(end);

    this.selectedCalendarStart.set(
      startKey
    );

    this.selectedCalendarEnd.set(
      endKey
    );

    this.calendarSelectionMode.set(
      'quick'
    );

    this.filtrosService.filterWhen.set(
      `RANGO:${startKey}:${endKey}`
    );

    if (typeof window !== 'undefined') {

      window.dispatchEvent(
        new CustomEvent(
          'oona:select-when',
          {
            detail: option
          }
        )
      );

    }
  }

  /*
   * =====================================================
   * SINCRONIZAR RANGO RÁPIDO
   * =====================================================
   */

  private syncQuickRangeWithFilter(): void {

    const current =
      this.filterWhen();

    if (
      current === 'Esta semana' ||
      current === 'Este finde' ||
      current === 'Próxima semana' ||
      current === 'Proxima semana'
    ) {

      this.selectQuickCalendarRange(
        current
      );

      return;
    }

    this.selectedCalendarStart.set(
      null
    );

    this.selectedCalendarEnd.set(
      null
    );
  }

  /*
   * =====================================================
   * APLICAR RANGO MANUAL
   * =====================================================
   */

  applyCustomDateRange(): void {

    const start =
      this.selectedCalendarStart();

    const end =
      this.selectedCalendarEnd();

    if (!start) {
      return;
    }

    const finalEnd =
      end || start;

    this.customDateFrom.set(
      start
    );

    this.customDateTo.set(
      finalEnd
    );

    this.filtrosService.filterWhen.set(
      `RANGO:${start}:${finalEnd}`
    );

    this.showDatePicker.set(
      false
    );
  }

  /*
   * =====================================================
   * BORRAR
   * =====================================================
   */

  clearDateFilter(): void {

    this.selectedCalendarStart.set(
      null
    );

    this.selectedCalendarEnd.set(
      null
    );

    this.customDateFrom.set(
      this.toDateParam(new Date())
    );

    this.customDateTo.set(
      this.toDateParam(new Date())
    );

    this.filtrosService.filterWhen.set(
      null
    );

    this.showDatePicker.set(
      false
    );
  }

  updateCustomDateFrom(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        .value;

    this.customDateFrom.set(
      value
    );
  }

  updateCustomDateTo(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        .value;

    this.customDateTo.set(
      value
    );
  }

  /*
   * =====================================================
   * ETIQUETA DEL BOTÓN
   * =====================================================
   */

  isCustomDateActive(): boolean {

    return this.filterWhen()
      ?.startsWith('RANGO:')
      ?? false;
  }

  customDateLabel(): string {

    if (!this.isCustomDateActive()) {
      return 'Elegir fecha';
    }

    const [
      ,
      from,
      to
    ] =
      this.filterWhen()
        ?.split(':')
      ?? [];

    return from === to
      ? this.formatShortDate(from)
      : `${this.formatShortDate(from)} - ${this.formatShortDate(to)}`;
  }

  /*
   * =====================================================
   * ORDENAMIENTO
   * =====================================================
   */

  toggleSortMenu(): void {

    this.showSortMenu.update(
      value => !value
    );
  }

  selectSort(
    option: EventSortOption
  ): void {

    this.selectedSort.set(
      option
    );

    this.showSortMenu.set(
      false
    );
  }

  toggleDescription(): void {

    this.expandedDescription.update(
      value => !value
    );
  }

  clearFilters(): void {

    this.showDatePicker.set(
      false
    );

    this.selectedCalendarStart.set(
      null
    );

    this.selectedCalendarEnd.set(
      null
    );

    this.filtrosService.clearFilters();
  }

  /*
   * =====================================================
   * FAVORITOS
   * =====================================================
   */

  toggleFavorito(
    item: EventCardResponse
  ): void {

    if (
      !this.authService.isLoggedIn
    ) {

      this.showFavoriteLoginCard.set(
        true
      );

      return;
    }

    this.favoritesService
      .toggleFavorite(
        'EVENTO',
        item.id
      )
      .subscribe({

        error: error => {

          console.error(
            'Error toggling favorite',
            error
          );

        }

      });
  }

  isFavorito(
    item: EventCardResponse
  ): boolean {

    return this.favoritos()
      .has(item.id);
  }

  /*
   * =====================================================
   * UTILIDADES
   * =====================================================
   */

  categoryEmoji(
    name: string | null
  ): string {

    return categoryIcon(name);
  }

  isOnline(
    item: EventCardResponse
  ): boolean {

    return item.modality ===
      EventModality.ONLINE;
  }

  formatDate(
    value: string | null
  ): string {

    if (!value) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat(
      'es-ES',
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(
      new Date(value)
    );
  }

  formatPrice(
    item: EventCardResponse
  ): string {

    if (
      item.priceFrom === null ||
      item.priceFrom === undefined
    ) {

      return 'Gratis';
    }

    return new Intl.NumberFormat(
      'es-ES',
      {
        style: 'currency',
        currency:
          item.currency || 'EUR',
        maximumFractionDigits: 0
      }
    ).format(
      item.priceFrom
    );
  }

  assetUrl(
    url: string | null | undefined,
    fallback = this.fallbackImage
  ): string {

    return this.eventosService
      .resolveAssetUrl(url)
      ?? fallback;
  }

  /*
   * =====================================================
   * LUNES DE UNA SEMANA
   * =====================================================
   *
   * Se mantiene porque PRÓXIMA SEMANA
   * empieza siempre el lunes.
   */

  private getMonday(
    date: Date
  ): Date {

    const result =
      new Date(date);

    const day =
      result.getDay();

    const diff =
      day === 0
        ? -6
        : 1 - day;

    result.setDate(
      result.getDate() + diff
    );

    return result;
  }

  /*
   * =====================================================
   * FECHA YYYY-MM-DD
   * =====================================================
   */

  private toDateParam(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /*
   * =====================================================
   * FECHA CORTA
   * =====================================================
   */

  private formatShortDate(
    value: string | undefined
  ): string {

    if (!value) {
      return 'Fecha';
    }

    return new Intl.DateTimeFormat(
      'es-ES',
      {
        day: '2-digit',
        month: 'short'
      }
    ).format(
      new Date(
        `${value}T00:00:00`
      )
    );
  }

  /*
   * =====================================================
   * BACKEND
   * =====================================================
   */

  private loadCategorias(): void {

    this.eventosService
      .getCategorias()
      .subscribe({

        next: categorias => {

          this.categorias.set(
            categorias.filter(
              categoria =>
                categoria.active
            )
          );

        },

        error: () => {

          this.categorias.set(
            []
          );

        }

      });
  }

  private loadExperienceTypes(): void {

    this.eventosService
      .getExperienceTypes()
      .subscribe({

        next: types => {

          this.experienceTypes.set(
            types
          );

        },

        error: () => {

          this.experienceTypes.set(
            []
          );

        }

      });
  }

  private loadEventos(
    criteria:
      Record<
        string,
        string | null
      >
  ): void {

    const requestKey =
      JSON.stringify(criteria);

    if (
      requestKey ===
      this.lastRequestKey
    ) {

      return;
    }

    this.lastRequestKey =
      requestKey;

    this.loading.set(
      true
    );

    this.error.set(
      null
    );

    this.eventosService
      .getEventos(
        this.buildFilters()
      )
      .subscribe({

        next: page => {

          this.eventos.set(
            page.content ?? []
          );

          this.totalEventos.set(
            page.totalElements
              ??
            page.content?.length
              ??
            0
          );

          this.loading.set(
            false
          );

        },

        error: () => {

          this.eventos.set(
            []
          );

          this.totalEventos.set(
            0
          );

          this.error.set(
            'El backend no está disponible en este momento. No se pueden mostrar eventos reales.'
          );

          this.loading.set(
            false
          );

        }

      });
  }

  private buildFilters():
    EventFilterParams {

    return {

      size: 24,

      search:
        this.searchQuery()
          .trim()
        || undefined,

      ...this.dateRangeFor(
        this.filterWhen()
      ),

      ...this.timeRangeFor(
        this.filterTimeOfDay()
      ),

      categoryId:
        this.categoryIdFor(
          this.filterCategories()[0]
        ),

      experienceTypeId:
        this.experienceTypeIdFor(
          this.filterTypes()[0]
        ),

      cityName:
        this.filterCity() !== 'Todas'
          ? this.filterCity()
          : undefined,

      modality:
        this.modalityFor(
          this.filterModality()
        ),

      isRecurring:
        this.recurrenceFor(
          this.filterRecurrence()
        ),

      sort:
        this.selectedSort().sort
    };
  }

  private categoryIdFor(
    name: string | undefined
  ): number | undefined {

    return this.categorias()
      .find(
        categoria =>
          categoria.name === name
      )
      ?.id;
  }

  private modalityFor(
    value: string | null
  ): EventModality | undefined {

    if (!value) {
      return undefined;
    }

    if (
      value.toLowerCase() ===
      'online'
    ) {

      return EventModality.ONLINE;
    }

    return EventModality.PRESENCIAL;
  }

  private recurrenceFor(
    value: string | null
  ): boolean | undefined {

    if (!value) {
      return undefined;
    }

    return value === 'Recurrente';
  }

  private experienceTypeIdFor(
    value: string | undefined
  ): number | undefined {

    return this.experienceTypes()
      .find(
        type =>
          type.name === value
      )
      ?.id;
  }

  private timeRangeFor(
    value: string | null
  ): Pick<
    EventFilterParams,
    'hourFrom' | 'hourTo'
  > {

    const map: Record<
      string,
      Pick<
        EventFilterParams,
        'hourFrom' | 'hourTo'
      >
    > = {

      'Manana': {
        hourFrom: 6,
        hourTo: 12
      },

      'Mañana': {
        hourFrom: 6,
        hourTo: 12
      },

      'Mediodia': {
        hourFrom: 12,
        hourTo: 16
      },

      'Mediodía': {
        hourFrom: 12,
        hourTo: 16
      },

      'Tarde': {
        hourFrom: 16,
        hourTo: 20
      },

      'Noche': {
        hourFrom: 20,
        hourTo: 23
      }

    };

    return value
      ? map[value] ?? {}
      : {};
  }

  /*
   * =====================================================
   * RANGO DE FECHAS PARA BACKEND
   * =====================================================
   */

  private dateRangeFor(
    value: string | null
  ): Pick<
    EventFilterParams,
    'dateFrom' | 'dateTo'
  > {

    if (!value) {
      return {};
    }

    /*
     * RANGO:
     *
     * Se usa tanto para selección manual
     * como para los botones rápidos.
     */

    if (
      value.startsWith('RANGO:')
    ) {

      const [
        ,
        dateFrom,
        dateTo
      ] =
        value.split(':');

      return {

        dateFrom,

        dateTo:
          dateTo || dateFrom

      };
    }

    const today =
      new Date();

    let start =
      new Date(today);

    let end =
      new Date(today);

    /*
     * =================================================
     * MAÑANA
     * =================================================
     */

    if (
      value === 'Mañana' ||
      value === 'Manana'
    ) {

      start.setDate(
        today.getDate() + 1
      );

      end.setDate(
        today.getDate() + 1
      );

    /*
     * =================================================
     * ESTE FINDE
     * =================================================
     */

    } else if (
      value === 'Este finde'
    ) {

      const day =
        today.getDay();

      let daysUntilSaturday =
        day === 6
          ? 0
          : 6 - day;

      if (day === 0) {
        daysUntilSaturday = -1;
      }

      start.setDate(
        today.getDate() +
        daysUntilSaturday
      );

      end =
        new Date(start);

      end.setDate(
        start.getDate() + 1
      );

    /*
     * =================================================
     * ESTA SEMANA
     *
     * IMPORTANTE:
     * HOY -> DOMINGO
     * =================================================
     */

    } else if (
      value === 'Esta semana'
    ) {

      start =
        new Date(today);

      const day =
        today.getDay();

      const daysUntilSunday =
        day === 0
          ? 0
          : 7 - day;

      end =
        new Date(today);

      end.setDate(
        today.getDate() +
        daysUntilSunday
      );

    /*
     * =================================================
     * PRÓXIMA SEMANA
     *
     * LUNES -> DOMINGO
     * =================================================
     */

    } else if (
      value === 'Próxima semana' ||
      value === 'Proxima semana'
    ) {

      start =
        this.getMonday(today);

      start.setDate(
        start.getDate() + 7
      );

      end =
        new Date(start);

      end.setDate(
        start.getDate() + 6
      );
    }

    return {

      dateFrom:
        this.toDateParam(start),

      dateTo:
        this.toDateParam(end)

    };
  }
}