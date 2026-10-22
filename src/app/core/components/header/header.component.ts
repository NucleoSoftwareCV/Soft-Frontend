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
  PLATFORM_ID,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of, timer } from 'rxjs';
import { catchError, debounceTime, filter, switchMap } from 'rxjs/operators';

import { FiltrosEstado, FiltrosService } from '../../../services/filtros.service';
import { AuthService } from '../../services/auth.service';
import {
  SearchCategoryMatch,
  SearchResults,
  SearchService,
} from '../../../services/search.service';
import { EventosService } from '../../../services/eventos.service';
import { EventCardResponse } from '../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../shared/models/one-to-one-service.model';
import { SpecialistProfileResponse } from '../../../services/profesionales.service';
import { resolveAssetUrl } from '../../../shared/utils/asset-url.util';
import { CityInterestService } from '../../../services/city-interest.service';
import { ToastService } from '../../../shared/services/toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly filtrosService = inject(FiltrosService);
  readonly authService = inject(AuthService);

  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly eventosService = inject(EventosService);
  private readonly cityInterestService = inject(CityInterestService);
  private readonly toastService = inject(ToastService);

  // Estados del encabezado.

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused = signal(false);
  isFilterOpen = signal(false);
  isCityOpen = signal(false);

  cityPopoverPosition = signal<{
    top: number;
    left: number;
  } | null>(null);

  isProfilePopoverOpen = signal(false);
  showLogoutConfirm = signal(false);
  showFavoritesLogin = signal(false);
  showFavoriteLoginCard = signal(false);

  // Buscador.

  searchQuery = signal('');
  searchResults = signal<SearchResults | null>(null);
  searching = signal(false);

  private readonly searchInput$ = new Subject<string>();
  private searchBlurTimeout?: ReturnType<typeof setTimeout>;

  // Ciudad.

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

  navLinks = [
    { label: 'Explorar', path: '/explorar' },
    { label: 'Sesiones 1:1', path: '/sesiones' },
    { label: 'Profesionales', path: '/profesionales' },
    { label: 'Conocer gente', path: '/match-bienestar' },
  ];

  inspirationTags = [
    'Yoga',
    'Meditación',
    'Baño de sonido',
    'Baño de hielo',
    'Breathwork',
    'Retiro',
  ];

  // Filtros pendientes.

  pendingWhen = signal<string | null>(null);
  pendingCategories = signal<string[]>([]);
  pendingTypes = signal<string[]>([]);
  pendingCity = signal<string>('Todas');
  pendingTimeOfDay = signal<string | null>(null);
  pendingModality = signal<string | null>(null);
  pendingRecurrence = signal<string | null>(null);
  pendingPrice = signal<string | null>(null);

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

  get priceOptions() {
    return this.filtrosService.priceOptions;
  }

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

  ngOnInit(): void {
    this.filtrosService.refreshCatalogs();

    if (this.isBrowser) {
      window.addEventListener('oona:open-filter', this.openFilterListener);
    }

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeHeaderPanels();
      });

    this.searchInput$
      .pipe(
        switchMap((value) => {
          const query = value.trim();

          this.searchResults.set(null);

          if (!query) {
            this.searching.set(false);
            return of(null);
          }

          this.searching.set(true);

          return timer(300).pipe(
            switchMap(() => this.searchService.search(query)),
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.searchResults.set(results);
      });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('oona:open-filter', this.openFilterListener);
    }

    clearTimeout(this.searchBlurTimeout);
    this.pendingCountSubscription.unsubscribe();

    this.searchInput$.complete();
    this.pendingCountTrigger$.complete();
  }

  private readonly openFilterListener = () => this.openFilter();

  private closeHeaderPanels(): void {
    this.closeSearch();

    this.isFilterOpen.set(false);
    this.isDateModalOpen.set(false);

    this.isCityOpen.set(false);
    this.cityPopoverPosition.set(null);

    this.isMobileMenuOpen.set(false);
    this.isProfilePopoverOpen.set(false);
    this.showLogoutConfirm.set(false);

    this.showFavoritesLogin.set(false);
    this.showFavoriteLoginCard.set(false);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) {
      this.isScrolled.set(window.scrollY > 10);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeHeaderPanels();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.isBrowser) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      this.isSearchFocused() &&
      !target.closest('.header__search-wrap') &&
      !target.closest('.header__search-toggle')
    ) {
      this.closeSearch();
    }

    if (
      this.isProfilePopoverOpen() &&
      !target.closest('.header__profile-container') &&
      !target.closest('.header__burger')
    ) {
      this.closeProfilePopover();
    }
  }

  // Menú móvil.

  toggleMobileMenu(): void {
    const opening = !this.isMobileMenuOpen();

    this.closeHeaderPanels();
    this.isMobileMenuOpen.set(opening);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  // Ciudad.

  toggleCity(event?: MouseEvent): void {
    const opening = !this.isCityOpen();

    this.closeHeaderPanels();
    this.isCityOpen.set(opening);

    if (opening) {
      this.cityInterestError.set(null);
      this.cityInterestEmail.set(this.authService.currentUser()?.email ?? '');

      this.updateCityPopoverPosition(event?.currentTarget as HTMLElement | undefined);
    }
  }

  private updateCityPopoverPosition(button?: HTMLElement): void {
    if (!this.isBrowser || !button || window.innerWidth <= 899) {
      this.cityPopoverPosition.set(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const popoverWidth = 280;
    const margin = 16;

    const left = Math.min(
      Math.max(rect.right - popoverWidth, margin),
      window.innerWidth - popoverWidth - margin,
    );

    this.cityPopoverPosition.set({
      top: rect.bottom + 8,
      left,
    });
  }

  closeCity(): void {
    this.isCityOpen.set(false);
    this.cityPopoverPosition.set(null);
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
      this.cityInterestError.set('Introduce un email válido.');
      return;
    }

    const city = this.filtrosService.getCityByName(this.selectedCityName());

    if (!city) {
      this.cityInterestError.set('No se pudo identificar la ciudad seleccionada.');
      return;
    }

    this.cityInterestError.set(null);
    this.cityInterestSubmitting.set(true);

    this.cityInterestService
      .registerInterest({
        cityId: city.id,
        email,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cityInterestSubmitting.set(false);
          this.closeCity();

          this.toastService.success(`¡Genial! Hemos guardado tu interés por ${city.name}`);
        },
        error: (err) => {
          this.cityInterestSubmitting.set(false);

          const message =
            err?.error?.message || 'No se pudo registrar tu interés. Inténtalo de nuevo.';

          this.cityInterestError.set(message);
        },
      });
  }

  // Buscador.

  onSearchFocus(): void {
    clearTimeout(this.searchBlurTimeout);

    this.isSearchFocused.set(true);
    this.isMobileMenuOpen.set(false);
    this.isProfilePopoverOpen.set(false);

    this.closeCity();
    this.closeFilter();
  }

  openSearch(): void {
    this.onSearchFocus();

    if (!this.isBrowser) {
      return;
    }

    queueMicrotask(() => {
      if (this.destroyRef.destroyed || !this.isSearchFocused()) {
        return;
      }

      this.host.nativeElement.querySelector<HTMLInputElement>('.header__search-input')?.focus();
    });
  }

  // Se conserva para compatibilidad si el HTML aún tiene (blur).
  onSearchBlur(): void {
    if (!this.isBrowser) {
      return;
    }

    clearTimeout(this.searchBlurTimeout);

    this.searchBlurTimeout = setTimeout(() => {
      if (this.destroyRef.destroyed) {
        return;
      }

      const activeElement = document.activeElement;

      if (
        !(activeElement instanceof Element) ||
        (!activeElement.closest('.header__search-wrap') &&
          !activeElement.closest('.header__search-toggle'))
      ) {
        this.closeSearch();
      }
    }, 160);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  closeSearch(): void {
    clearTimeout(this.searchBlurTimeout);

    this.isSearchFocused.set(false);
    this.searchQuery.set('');

    // Cancela la espera y cualquier búsqueda anterior.
    this.searchInput$.next('');

    this.searchResults.set(null);
    this.searching.set(false);
  }

  resolveImage(url?: string | null, fallback = ''): string {
    return url ? resolveAssetUrl(url) : fallback;
  }

  formatSearchDate(value: string | null): string {
    if (!value) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
      .format(new Date(value))
      .replace('.', '');
  }

  goToAllResults(): void {
    const query = this.searchQuery().trim();

    if (!query) {
      return;
    }

    this.closeHeaderPanels();

    void this.router.navigate(['/explorar'], {
      queryParams: { q: query },
    });
  }

  selectSearchCategory(category: SearchCategoryMatch): void {
    this.filtrosService.filterCategories.set([category.name]);
    this.closeHeaderPanels();

    void this.router.navigate(['/explorar']);
  }

  selectSearchEvent(event: EventCardResponse): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/evento', event.id]);
  }

  selectSearchSession(session: OneToOneServiceCardResponse): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/sesiones', session.id]);
  }

  selectSearchOrganizer(organizer: SpecialistProfileResponse): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/profesionales', organizer.slug]);
  }

  // Perfil.

  toggleProfilePopover(): void {
    const opening = !this.isProfilePopoverOpen();

    this.closeHeaderPanels();
    this.isProfilePopoverOpen.set(opening);
  }

  closeProfilePopover(): void {
    this.isProfilePopoverOpen.set(false);
  }

  // Guardados.

  sClick(): void {
    this.closeHeaderPanels();

    if (this.authService.isLoggedIn) {
      void this.router.navigate(['/perfil'], {
        queryParams: {
          tab: 'guardados',
        },
      });

      return;
    }

    this.showFavoriteLoginCard.set(true);
  }

  closeFavoritesLogin(): void {
    this.showFavoritesLogin.set(false);
  }

  goToRegister(): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/auth/login']);
  }

  cerrarFavoriteLoginCard(): void {
    this.showFavoriteLoginCard.set(false);
  }

  irAAuthLogin(): void {
    this.closeHeaderPanels();

    void this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: '/',
      },
    });
  }

  // Cierre de sesión.

  openLogoutConfirm(): void {
    this.closeHeaderPanels();
    this.showLogoutConfirm.set(true);
  }

  logout(): void {
    this.closeHeaderPanels();
    this.authService.logout();

    void this.router.navigate(['/']);
  }

  // Usuario.

  getUserInitial(): string {
    const user = this.authService.currentUser();

    if (!user) {
      return 'U';
    }

    const name = user.username || user.email || 'U';

    return name.charAt(0).toUpperCase();
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
    return this.authService.roles.includes('PROFESSIONAL');
  }

  selectInspiration(tag: string): void {
    this.onSearchFocus();
    this.onSearchInput(tag);
  }

  // Filtros.

  openFilter(): void {
    this.closeHeaderPanels();
    this.filtrosService.refreshCatalogs();

    this.pendingWhen.set(this.filtrosService.filterWhen());
    this.pendingCategories.set([...this.filtrosService.filterCategories()]);
    this.pendingTypes.set([...this.filtrosService.filterTypes()]);
    this.pendingCity.set(this.filtrosService.filterCity());
    this.pendingTimeOfDay.set(this.filtrosService.filterTimeOfDay());
    this.pendingModality.set(this.filtrosService.filterModality());
    this.pendingRecurrence.set(this.filtrosService.filterRecurrence());
    this.pendingPrice.set(this.filtrosService.filterPrice());

    this.pendingResultsCount.set(null);
    this.countLoading.set(false);

    this.isFilterOpen.set(true);
  }

  applyFilters(): void {
    this.filtrosService.filterWhen.set(this.pendingWhen());
    this.filtrosService.filterCategories.set([...this.pendingCategories()]);
    this.filtrosService.filterTypes.set([...this.pendingTypes()]);
    this.filtrosService.filterCity.set(this.pendingCity());
    this.filtrosService.filterTimeOfDay.set(this.pendingTimeOfDay());
    this.filtrosService.filterModality.set(this.pendingModality());
    this.filtrosService.filterRecurrence.set(this.pendingRecurrence());
    this.filtrosService.filterPrice.set(this.pendingPrice());

    this.closeFilter();
  }

  closeFilter(): void {
    this.isDateModalOpen.set(false);
    this.isFilterOpen.set(false);
  }

  pendingSelectWhen(opt: string): void {
    this.pendingWhen.set(this.pendingWhen() === opt ? null : opt);
  }

  pendingToggleCategory(cat: string): void {
    const current = this.pendingCategories();

    this.pendingCategories.set(
      current.includes(cat) ? current.filter((item) => item !== cat) : [...current, cat],
    );
  }

  pendingToggleType(type: string): void {
    const current = this.pendingTypes();

    this.pendingTypes.set(
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  }

  pendingSelectCity(city: string): void {
    this.pendingCity.set(city);
  }

  pendingSelectTimeOfDay(value: string): void {
    this.pendingTimeOfDay.set(this.pendingTimeOfDay() === value ? null : value);
  }

  pendingSelectModality(value: string): void {
    this.pendingModality.set(this.pendingModality() === value ? null : value);
  }

  pendingSelectRecurrence(value: string): void {
    this.pendingRecurrence.set(this.pendingRecurrence() === value ? null : value);
  }

  pendingSelectPrice(price: string): void {
    this.pendingPrice.set(this.pendingPrice() === price ? null : price);
  }

  pendingClearFilters(): void {
    this.pendingWhen.set(null);
    this.pendingCategories.set([]);
    this.pendingTypes.set([]);
    this.pendingCity.set('Todas');
    this.pendingTimeOfDay.set(null);
    this.pendingModality.set(null);
    this.pendingRecurrence.set(null);
    this.pendingPrice.set(null);
    this.pendingDateFrom.set(null);
    this.pendingDateTo.set(null);
  }

  // Selector de fechas.

  isDateModalOpen = signal(false);
  calendarMonth = signal<Date>(this.startOfMonth(new Date()));
  pendingDateFrom = signal<Date | null>(null);
  pendingDateTo = signal<Date | null>(null);

  weekDayLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

  readonly isCustomDatePending = computed(() => !!this.pendingWhen()?.startsWith('RANGO:'));

  readonly pendingDateChipLabel = computed(() => {
    const when = this.pendingWhen();

    if (!when || !when.startsWith('RANGO:')) {
      return 'Elegir fecha';
    }

    const [, from, to] = when.split(':');

    const label = (iso: string) =>
      new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
      })
        .format(new Date(iso + 'T00:00:00'))
        .replace('.', '');

    if (!to || to === from) {
      return label(from);
    }

    return `${label(from)} – ${label(to)}`;
  });

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

  selectDateQuick(opt: string): void {
    this.pendingWhen.set(opt);
    this.pendingDateFrom.set(null);
    this.pendingDateTo.set(null);

    this.closeDatePicker();
  }

  readonly monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(this.calendarMonth());

    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  readonly canGoToPrevMonth = computed(
    () => this.calendarMonth().getTime() > this.startOfMonth(new Date()).getTime(),
  );

  prevMonth(): void {
    if (!this.canGoToPrevMonth()) {
      return;
    }

    this.calendarMonth.update((month) => {
      const previous = new Date(month);
      previous.setMonth(previous.getMonth() - 1);
      return previous;
    });
  }

  nextMonth(): void {
    this.calendarMonth.update((month) => {
      const next = new Date(month);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  readonly calendarDays = computed<CalendarDayCell[]>(() => {
    const month = this.calendarMonth();
    const from = this.pendingDateFrom();
    const to = this.pendingDateTo();
    const today = this.startOfDay(new Date());

    const gridStart = this.startOfMonth(month);
    const shift = (gridStart.getDay() + 6) % 7;

    gridStart.setDate(gridStart.getDate() - shift);

    const cells: CalendarDayCell[] = [];

    for (let index = 0; index < 42; index++) {
      const cellDate = new Date(gridStart);

      cellDate.setDate(gridStart.getDate() + index);

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

  applyDateSelection(): void {
    const from = this.pendingDateFrom();

    if (!from) {
      this.closeDatePicker();
      return;
    }

    const to = this.pendingDateTo() ?? from;

    this.pendingWhen.set(`RANGO:${this.toIsoDate(from)}:${this.toIsoDate(to)}`);

    this.closeDatePicker();
  }

  private isBetweenSelection(date: Date, from: Date | null, to: Date | null): boolean {
    if (!from) {
      return false;
    }

    if (!to) {
      return date.getTime() === from.getTime();
    }

    return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
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

  // Contador de resultados de los filtros.

  pendingResultsCount = signal<number | null>(null);
  countLoading = signal(false);

  private readonly pendingCountTrigger$ = new Subject<void>();

  private readonly pendingCountSubscription = this.pendingCountTrigger$
    .pipe(
      debounceTime(250),
      switchMap(() => {
        if (!this.isBrowser || !this.isFilterOpen()) {
          return of(null);
        }

        this.countLoading.set(true);

        return this.eventosService
          .getEventos({
            page: 0,
            size: 1,
            ...this.filtrosService.buildEventFilterParams(this.pendingSnapshot()),
          })
          .pipe(catchError(() => of(null)));
      }),
    )
    .subscribe((page) => {
      this.countLoading.set(false);

      this.pendingResultsCount.set(this.isFilterOpen() && page ? page.totalElements : null);
    });

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

  readonly dateButtonLabel = computed(() => this.applyButtonLabel());
}
