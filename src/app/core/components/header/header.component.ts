import {
  Component,
  HostListener,
  signal,
  computed,
  effect,
  untracked,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { FiltrosEstado, FiltrosService } from '../../../services/filtros.service';
import { AuthService } from '../../services/auth.service';
import {
  SearchCategoryMatch,
  SearchResults,
  SearchService
} from '../../../services/search.service';
import { EventosService } from '../../../services/eventos.service';

import { EventCardResponse } from '../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../shared/models/one-to-one-service.model';
import { SpecialistProfileResponse } from '../../../services/profesionales.service';
import { resolveAssetUrl } from '../../../shared/utils/asset-url.util';
import { CityInterestService } from '../../../services/city-interest.service';
import { ToastService } from '../../../shared/services/toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Celda del calendario del selector de fecha del header. */
interface CalendarDayCell {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly filtrosService = inject(FiltrosService);
  readonly authService = inject(AuthService);

  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly eventosService = inject(EventosService);
  private readonly cityInterestService = inject(CityInterestService);
  private readonly toastService = inject(ToastService);

  // =========================================================
  // ESTADOS DEL HEADER
  // =========================================================

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused = signal(false);
  isFilterOpen = signal(false);
  isCityOpen = signal(false);

  cityPopoverPosition = signal<{ top: number; left: number } | null>(null);

  isProfilePopoverOpen = signal(false);
  showLogoutConfirm = signal(false);

  // Card de favoritos/guardados cuando no hay sesión
  showFavoritesLogin = signal(false);

  // ★ NUEVO: card de login para guardados (la que usa el HTML del header)
  showFavoriteLoginCard = signal(false);

  // =========================================================
  // BUSCADOR
  // =========================================================

  searchQuery = signal('');
  searchResults = signal<SearchResults | null>(null);
  searching = signal(false);

  private readonly searchInput$ = new Subject<string>();

  // =========================================================
  // CIUDAD
  // =========================================================

  cityInterestEmail = signal('');
  cityInterestSubmitting = signal(false);
  cityInterestError = signal<string | null>(null);

  readonly selectedCityName = computed(() => {
    const selected = this.filtrosService.filterCity();

    if (selected !== 'Todas') {
      return selected;
    }

    return this.filtrosService.cities()[0]?.name ?? 'tu ciudad';
  });

  // =========================================================
  // NAVEGACIÓN PRINCIPAL
  // =========================================================

  navLinks = [
    { label: 'Explorar', path: '/explorar' },
    { label: 'Sesiones 1:1', path: '/sesiones' },
    { label: 'Profesionales', path: '/profesionales' },
    { label: 'Conocer gente', path: '/match-bienestar' },
  ];

  // =========================================================
  // INSPIRACIÓN
  // =========================================================

  inspirationTags = [
    'Yoga',
    'Meditación',
    'Baño de sonido',
    'Baño de hielo',
    'Breathwork',
    'Retiro',
  ];

  // =========================================================
  // FILTROS PENDIENTES
  // =========================================================

  pendingWhen = signal<string | null>(null);
  pendingCategories = signal<string[]>([]);
  pendingTypes = signal<string[]>([]);
  pendingCity = signal<string>('Todas');
  pendingTimeOfDay = signal<string | null>(null);
  pendingModality = signal<string | null>(null);
  pendingRecurrence = signal<string | null>(null);

  // ★ NUEVO: precio pendiente (pills del modal de filtros)
  pendingPrice = signal<string | null>(null);

  // =========================================================
  // OPCIONES DE FILTROS
  // =========================================================

  get whenOptions() {
    return this.filtrosService.whenOptions;
  }

  get categoryOptions() {
    return this.filtrosService.categoryOptions;
  }

  get typeOptions() {
    return this.filtrosService.typeOptions;
  }

  get cityOptions() {
    return this.filtrosService.cityOptions;
  }

  get timeOptions() {
    return this.filtrosService.timeOptions;
  }

  get modalityOptions() {
    return this.filtrosService.modalityOptions;
  }

  get recurrenceOptions() {
    return this.filtrosService.recurrenceOptions;
  }

  // ★ NUEVO: pills de precio del modal
  get priceOptions() {
    return this.filtrosService.priceOptions;
  }

  // =========================================================
  // CONTADOR DE FILTROS
  // =========================================================

  get activeFilterCount(): number {
    return this.filtrosService.activeFilterCount;
  }

  get pendingFilterCount(): number {
    return (
      (this.pendingWhen() ? 1 : 0) +
      this.pendingCategories().length +
      this.pendingTypes().length +
      (this.pendingCity() !== 'Todas' ? 1 : 0) +
      (this.pendingTimeOfDay() ? 1 : 0) +
      (this.pendingModality() ? 1 : 0) +
      (this.pendingRecurrence() ? 1 : 0) +
      (this.pendingPrice() ? 1 : 0)
    );
  }

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.filtrosService.refreshCatalogs();

    if (this.isBrowser) {
      window.addEventListener(
        'oona:open-filter',
        this.openFilterListener
      );
    }

    this.searchInput$       .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          const trimmed = query.trim();

          if (!trimmed) {
            this.searching.set(false);
            return [null];
          }

          this.searching.set(true);

          return this.searchService.search(trimmed);
        }),
      )
      .subscribe(results => {
        this.searching.set(false);
        this.searchResults.set(results);
      });
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener(
        'oona:open-filter',
        this.openFilterListener
      );
    }

    this.pendingCountSubscription.unsubscribe();
  }

  private readonly openFilterListener = () => this.openFilter();

  // =========================================================
  // SCROLL
  // =========================================================

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) {
      this.isScrolled.set(window.scrollY > 10);
    }
  }

  // =========================================================
  // ESCAPE
  // =========================================================

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isFilterOpen.set(false);
    this.isCityOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isSearchFocused.set(false);
    this.isProfilePopoverOpen.set(false);
    this.showLogoutConfirm.set(false);
    this.showFavoritesLogin.set(false);

    // ★ NUEVO: cierra también el modal de fecha y la card de guardados
    this.isDateModalOpen.set(false);
    this.showFavoriteLoginCard.set(false);
  }

  // =========================================================
  // CLICK FUERA
  // =========================================================

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.isProfilePopoverOpen()) {
      const target = event.target as HTMLElement;

      if (
        !target.closest('.header__profile-container') &&
        !target.closest('.header__burger')
      ) {
        this.isProfilePopoverOpen.set(false);
      }
    }
  }

  // =========================================================
  // MENÚ MÓVIL
  // =========================================================

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  // =========================================================
  // CIUDAD
  // =========================================================

  toggleCity(event?: MouseEvent): void {
    const opening = !this.isCityOpen();

    this.isCityOpen.set(opening);
    this.isFilterOpen.set(false);

    if (opening) {
      this.cityInterestError.set(null);

      this.cityInterestEmail.set(
        this.authService.currentUser()?.email ?? ''
      );

      this.updateCityPopoverPosition(
        event?.currentTarget as HTMLElement | undefined
      );
    }
  }

  private updateCityPopoverPosition(button?: HTMLElement): void {
    // En móvil el popover se muestra como banner mediante CSS
    if (
      !this.isBrowser ||
      !button ||
      window.innerWidth <= 899
    ) {
      this.cityPopoverPosition.set(null);
      return;
    }

    const rect = button.getBoundingClientRect();

    const popoverWidth = 280;
    const margin = 16;

    const left = Math.min(
      Math.max(rect.right - popoverWidth, margin),
      window.innerWidth - popoverWidth - margin
    );

    this.cityPopoverPosition.set({
      top: rect.bottom + 8,
      left
    });
  }

  closeCity(): void {
    this.isCityOpen.set(false);
  }

  onCityInterestEmailInput(value: string): void {
    this.cityInterestEmail.set(value);

    if (this.cityInterestError()) {
      this.cityInterestError.set(null);
    }
  }

  submitCityInterest(): void {
    if (this.cityInterestSubmitting()) {
      return;
    }

    const email = this.cityInterestEmail().trim();

    if (!EMAIL_PATTERN.test(email)) {
      this.cityInterestError.set(
        'Introduce un email válido.'
      );
      return;
    }

    const city = this.filtrosService.getCityByName(
      this.selectedCityName()
    );

    if (!city) {
      this.cityInterestError.set(
        'No se pudo identificar la ciudad seleccionada.'
      );
      return;
    }

    this.cityInterestError.set(null);
    this.cityInterestSubmitting.set(true);

    this.cityInterestService
      .registerInterest({
        cityId: city.id,
        email
      })
      .subscribe({
        next: () => {
          this.cityInterestSubmitting.set(false);

          this.closeCity();

          this.toastService.success(
            `¡Genial! Hemos guardado tu interés por ${city.name}`
          );
        },

        error: err => {
          this.cityInterestSubmitting.set(false);

          const message =
            err?.error?.message ||
            'No se pudo registrar tu interés. Inténtalo de nuevo.';

          this.cityInterestError.set(message);
        },
      });
  }

  // =========================================================
  // BUSCADOR
  // =========================================================

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
  }
openSearch(): void {
  this.isSearchFocused.set(true);
}
onSearchBlur(): void {
  setTimeout(() => {
    const activeElement = document.activeElement;

    if (!(activeElement instanceof HTMLElement)) {
      this.isSearchFocused.set(false);
      return;
    }

    if (!activeElement.closest('.header__search-wrap')) {
      this.isSearchFocused.set(false);
    }
  }, 160);
}

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  resolveImage(
    url?: string | null,
    fallback = ''
  ): string {
    return url
      ? resolveAssetUrl(url)
      : fallback;
  }

  formatSearchDate(value: string | null): string {
    if (!value) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat(
      'es-ES',
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }
    )
      .format(new Date(value))
      .replace('.', '');
  }

  goToAllResults(): void {
    const query = this.searchQuery().trim();

    if (!query) {
      return;
    }

    this.closeSearch();

    this.router.navigate(
      ['/explorar'],
      {
        queryParams: { q: query }
      }
    );
  }

  selectSearchCategory(
    category: SearchCategoryMatch
  ): void {
    this.filtrosService.filterCategories.set(
      [category.name]
    );

    this.closeSearch();

    this.router.navigate(['/explorar']);
  }

  selectSearchEvent(
    event: EventCardResponse
  ): void {
    this.closeSearch();

    this.router.navigate(
      ['/evento', event.id]
    );
  }

  selectSearchSession(
    session: OneToOneServiceCardResponse
  ): void {
    this.closeSearch();

    this.router.navigate(
      ['/sesiones', session.id]
    );
  }

  selectSearchOrganizer(
    organizer: SpecialistProfileResponse
  ): void {
    this.closeSearch();

    this.router.navigate(
      ['/profesionales', organizer.slug]
    );
  }

  private closeSearch(): void {
    this.isSearchFocused.set(false);
    this.searchQuery.set('');
    this.searchResults.set(null);
  }

  // =========================================================
  // PERFIL / POPOVER
  // =========================================================

  toggleProfilePopover(): void {
    this.isProfilePopoverOpen.update(v => !v);
  }

  closeProfilePopover(): void {
    this.isProfilePopoverOpen.set(false);
  }

  // =========================================================
  // ❤️ GUARDADOS DESDE EL HEADER
  // =========================================================
  sClick(): void {

    // CON SESIÓN → Perfil → Guardados
    if (this.authService.isLoggedIn) {
      this.router.navigate(
        ['/perfil'],
        {
          queryParams: {
            tab: 'guardados'
          }
        }
      );

      return;
    }

    // ★ NUEVO: SIN SESIÓN → card de login para guardados
    // (antes navegaba a /favoritos; ahora muestra la card
    //  flotante que ya está maquetada en el HTML del header)
    this.showFavoriteLoginCard.set(true);
  }

  closeFavoritesLogin(): void {
    this.showFavoritesLogin.set(false);
  }

  goToRegister(): void {
    this.closeFavoritesLogin();
    this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.closeFavoritesLogin();
    this.router.navigate(['/auth/login']);
  }

  // ★ NUEVO: card de login para guardados (la del HTML)

  cerrarFavoriteLoginCard(): void {
    this.showFavoriteLoginCard.set(false);
  }

  irAAuthLogin(): void {
    this.showFavoriteLoginCard.set(false);

    this.router.navigate(
      ['/auth/login'],
      { queryParams: { returnUrl: '/' } }
    );
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  openLogoutConfirm(): void {
    this.showLogoutConfirm.set(true);
    this.isProfilePopoverOpen.set(false);
  }

  logout(): void {
    this.authService.logout();

    this.showLogoutConfirm.set(false);
    this.isProfilePopoverOpen.set(false);

    this.router.navigate(['/']);
  }

  // =========================================================
  // USUARIO
  // =========================================================

  getUserInitial(): string {
    const user = this.authService.currentUser();

    if (!user) {
      return 'U';
    }

    const name =
      user.username ||
      user.email ||
      'U';

    return name
      .charAt(0)
      .toUpperCase();
  }

  getUsername(): string {
    const user = this.authService.currentUser();

    if (!user) {
      return 'Usuario';
    }

    if (user.username) {
      return user.username;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Usuario';
  }

  get isProfessional(): boolean {
    return this.authService.roles.includes(
      'PROFESSIONAL'
    );
  }

  // =========================================================
  // INSPIRACIÓN
  // =========================================================

  selectInspiration(tag: string): void {
    this.onSearchInput(tag);
  }

  // =========================================================
  // FILTROS
  // =========================================================

  openFilter(): void {
    this.filtrosService.refreshCatalogs();

    this.pendingWhen.set(
      this.filtrosService.filterWhen()
    );

    this.pendingCategories.set([
      ...this.filtrosService.filterCategories()
    ]);

    this.pendingTypes.set([
      ...this.filtrosService.filterTypes()
    ]);

    this.pendingCity.set(
      this.filtrosService.filterCity()
    );

    this.pendingTimeOfDay.set(
      this.filtrosService.filterTimeOfDay()
    );

    this.pendingModality.set(
      this.filtrosService.filterModality()
    );

    this.pendingRecurrence.set(
      this.filtrosService.filterRecurrence()
    );

    // ★ NUEVO: precio aplicado → pendiente
    this.pendingPrice.set(
      this.filtrosService.filterPrice()
    );

    // ★ NUEVO: resetea el contador para que no muestre
    // un número viejo mientras recalcula
    this.pendingResultsCount.set(null);
    this.countLoading.set(false);

    this.isFilterOpen.set(true);
    this.isCityOpen.set(false);
  }

  applyFilters(): void {
    this.filtrosService.filterWhen.set(
      this.pendingWhen()
    );

    this.filtrosService.filterCategories.set([
      ...this.pendingCategories()
    ]);

    this.filtrosService.filterTypes.set([
      ...this.pendingTypes()
    ]);

    this.filtrosService.filterCity.set(
      this.pendingCity()
    );

    this.filtrosService.filterTimeOfDay.set(
      this.pendingTimeOfDay()
    );

    this.filtrosService.filterModality.set(
      this.pendingModality()
    );

    this.filtrosService.filterRecurrence.set(
      this.pendingRecurrence()
    );

    // ★ NUEVO: aplica el precio pendiente
    this.filtrosService.filterPrice.set(
      this.pendingPrice()
    );

    this.isFilterOpen.set(false);
  }

  closeFilter(): void {
    this.isFilterOpen.set(false);
  }

  pendingSelectWhen(opt: string): void {
    this.pendingWhen.set(
      this.pendingWhen() === opt
        ? null
        : opt
    );
  }

  pendingToggleCategory(cat: string): void {
    const current =
      this.pendingCategories();

    this.pendingCategories.set(
      current.includes(cat)
        ? current.filter(x => x !== cat)
        : [...current, cat]
    );
  }

  pendingToggleType(t: string): void {
    const current =
      this.pendingTypes();

    this.pendingTypes.set(
      current.includes(t)
        ? current.filter(x => x !== t)
        : [...current, t]
    );
  }

  pendingSelectCity(city: string): void {
    this.pendingCity.set(city);
  }

  pendingSelectTimeOfDay(t: string): void {
    this.pendingTimeOfDay.set(
      this.pendingTimeOfDay() === t
        ? null
        : t
    );
  }

  pendingSelectModality(m: string): void {
    this.pendingModality.set(
      this.pendingModality() === m
        ? null
        : m
    );
  }

  pendingSelectRecurrence(r: string): void {
    this.pendingRecurrence.set(
      this.pendingRecurrence() === r
        ? null
        : r
    );
  }

  // ★ NUEVO: selección de pill de precio
  pendingSelectPrice(price: string): void {
    this.pendingPrice.set(
      this.pendingPrice() === price
        ? null
        : price
    );
  }

  pendingClearFilters(): void {
    this.pendingWhen.set(null);
    this.pendingCategories.set([]);
    this.pendingTypes.set([]);
    this.pendingCity.set('Todas');
    this.pendingTimeOfDay.set(null);
    this.pendingModality.set(null);
    this.pendingRecurrence.set(null);

    // ★ NUEVO: limpia también precio y fechas
    this.pendingPrice.set(null);
    this.pendingDateFrom.set(null);
    this.pendingDateTo.set(null);
  }

  // =========================================================
  // ★ NUEVO: SELECTOR DE FECHA (modal "Elegir fecha")
  // =========================================================

  isDateModalOpen = signal(false);
  calendarMonth = signal<Date>(this.startOfMonth(new Date()));
  pendingDateFrom = signal<Date | null>(null);
  pendingDateTo = signal<Date | null>(null);

  weekDayLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

  /** El chip "Elegir fecha" se marca activo cuando hay un rango custom. */
  readonly isCustomDatePending = computed(
    () => !!this.pendingWhen()?.startsWith('RANGO:')
  );

  /** Etiqueta del chip: "Elegir fecha" o el rango elegido ("12 sep – 14 sep"). */
  readonly pendingDateChipLabel = computed(() => {
    const when = this.pendingWhen();

    if (!when || !when.startsWith('RANGO:')) {
      return 'Elegir fecha';
    }

    const [, from, to] = when.split(':');

    const label = (iso: string) =>
      new Intl.DateTimeFormat(
        'es-ES',
        { day: 'numeric', month: 'short' }
      )
        .format(new Date(iso + 'T00:00:00'))
        .replace('.', '');

    if (!to || to === from) {
      return label(from);
    }

    return `${label(from)} – ${label(to)}`;
  });

  /** Pills rápidos del modal de fecha (mismos "when" del filtro). */
  get dateQuickOptions(): string[] {
    return this.filtrosService.whenOptions;
  }

  openDatePicker(): void {
    const when = this.pendingWhen();

    if (when && when.startsWith('RANGO:')) {
      const [, from, to] = when.split(':');

      this.pendingDateFrom.set(new Date(from + 'T00:00:00'));
      this.pendingDateTo.set(to ? new Date(to + 'T00:00:00') : null);
      this.calendarMonth.set(this.startOfMonth(new Date(from + 'T00:00:00')));
    } else {
      this.pendingDateFrom.set(null);
      this.pendingDateTo.set(null);
      this.calendarMonth.set(this.startOfMonth(new Date()));
    }

    this.isDateModalOpen.set(true);
  }

  closeDatePicker(): void {
    this.isDateModalOpen.set(false);
  }

  /** Pill rápido: Hoy / Mañana / Este finde... (descarta el rango custom). */
  selectDateQuick(opt: string): void {
    this.pendingWhen.set(opt);

    this.pendingDateFrom.set(null);
    this.pendingDateTo.set(null);

    this.closeDatePicker();
  }

  readonly monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat(
      'es-ES',
      { month: 'long', year: 'numeric' }
    ).format(this.calendarMonth());

    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  /** No se puede navegar a meses anteriores al actual. */
  readonly canGoToPrevMonth = computed(
    () =>
      this.calendarMonth().getTime() >
      this.startOfMonth(new Date()).getTime()
  );

  prevMonth(): void {
    if (!this.canGoToPrevMonth()) {
      return;
    }

    this.calendarMonth.update(month => {
      const previous = new Date(month);
      previous.setMonth(previous.getMonth() - 1);
      return previous;
    });
  }

  nextMonth(): void {
    this.calendarMonth.update(month => {
      const next = new Date(month);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  /** Rejilla de 6 semanas empezando en lunes. */
  readonly calendarDays = computed<CalendarDayCell[]>(() => {
    const month = this.calendarMonth();
    const from = this.pendingDateFrom();
    const to = this.pendingDateTo();
    const today = this.startOfDay(new Date());

    const gridStart = this.startOfMonth(month);
    const shift = (gridStart.getDay() + 6) % 7;
    gridStart.setDate(gridStart.getDate() - shift);

    const cells: CalendarDayCell[] = [];

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);

      cells.push({
        date: this.toIsoDate(cellDate),
        day: cellDate.getDate(),
        inMonth: cellDate.getMonth() === month.getMonth(),
        isToday: cellDate.getTime() === today.getTime(),
        isSelected: this.isBetweenSelection(cellDate, from, to),
        isPast: cellDate.getTime() < today.getTime(),
      });
    }

    return cells;
  });

  /**
   * Primer click → fecha inicial. Segundo click → fecha final
   * (si es anterior a la inicial, la sustituye).
   */
  selectCalendarDay(cell: CalendarDayCell): void {
    if (cell.isPast) {
      return;
    }

    const clicked = new Date(cell.date + 'T00:00:00');
    const from = this.pendingDateFrom();
    const to = this.pendingDateTo();

    if (from && !to) {
      if (clicked.getTime() < from.getTime()) {
        this.pendingDateFrom.set(clicked);
      } else {
        this.pendingDateTo.set(clicked);
      }
    } else {
      this.pendingDateFrom.set(clicked);
      this.pendingDateTo.set(null);
    }
  }

  clearDateSelection(): void {
    this.pendingWhen.set(null);

    this.pendingDateFrom.set(null);
    this.pendingDateTo.set(null);
  }

  /** Vuelca la selección del calendario a pendingWhen en formato RANGO. */
  applyDateSelection(): void {
    const from = this.pendingDateFrom();

    if (!from) {
      this.closeDatePicker();
      return;
    }

    const to = this.pendingDateTo() ?? from;

    this.pendingWhen.set(
      `RANGO:${this.toIsoDate(from)}:${this.toIsoDate(to)}`
    );

    this.closeDatePicker();
  }

  private isBetweenSelection(
    date: Date,
    from: Date | null,
    to: Date | null
  ): boolean {
    if (!from) {
      return false;
    }

    if (!to) {
      return date.getTime() === from.getTime();
    }

    return (
      date.getTime() >= from.getTime() &&
      date.getTime() <= to.getTime()
    );
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // ★ NUEVO: CONTADOR DE RESULTADOS EN VIVO
  // =========================================================

  pendingResultsCount = signal<number | null>(null);
  countLoading = signal(false);

  private readonly pendingCountTrigger$ = new Subject<void>();

  /** Pipeline con debounce: cuenta resultados del estado pendiente. */
  private readonly pendingCountSubscription = this.pendingCountTrigger$     .pipe(
      debounceTime(250),
      switchMap(() => {
        this.countLoading.set(true);

        return this.eventosService
          .getEventos({
            page: 0,
            size: 1,
            ...this.filtrosService.buildEventFilterParams(
              this.pendingSnapshot()
            ),
          })
          .pipe(catchError(() => of(null)));
      })
    )
    .subscribe(page => {
      this.countLoading.set(false);

      this.pendingResultsCount.set(
        page ? page.totalElements : null
      );
    });

  /**
   * Dispara el contador cada vez que cambia un filtro pendiente
   * mientras el modal está abierto (no hace peticiones con el
   * modal cerrado, ni en SSR).
   */
  private readonly pendingCountEffect = effect(() => {
    if (!this.isBrowser || !this.isFilterOpen()) {
      return;
    }

    this.pendingWhen();
    this.pendingCategories();
    this.pendingTypes();
    this.pendingCity();
    this.pendingTimeOfDay();
    this.pendingModality();
    this.pendingRecurrence();
    this.pendingPrice();

    untracked(() => this.pendingCountTrigger$.next());
  });

  private pendingSnapshot(): FiltrosEstado {
    return {
      when: this.pendingWhen(),
      categories: [...this.pendingCategories()],
      types: [...this.pendingTypes()],
      city: this.pendingCity(),
      timeOfDay: this.pendingTimeOfDay(),
      modality: this.pendingModality(),
      recurrence: this.pendingRecurrence(),
      price: this.pendingPrice(),
    };
  }

  /** "Mostrar 24 experiencias" / "Contando…" / "Mostrar resultados". */
  readonly applyButtonLabel = computed(() => {
    if (this.countLoading()) {
      return 'Contando…';
    }

    const count = this.pendingResultsCount();

    if (count === null) {
      return 'Mostrar resultados';
    }

    return `Mostrar ${count} ${count === 1 ? 'experiencia' : 'experiencias'}`;
  });

  /** Etiqueta del botón aplicar del modal de fecha. */
  readonly dateButtonLabel = computed(() => this.applyButtonLabel());
}