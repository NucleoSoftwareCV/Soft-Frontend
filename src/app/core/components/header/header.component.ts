import { Component, HostListener, signal, computed, effect, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FiltrosEstado, FiltrosService } from '../../../services/filtros.service';
import { EventosService } from '../../../services/eventos.service';
import { AuthService } from '../../services/auth.service';
import { SearchCategoryMatch, SearchResults, SearchService } from '../../../services/search.service';
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
  isPast: boolean;
  isSelected: boolean;
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
  private readonly isBrowser  = isPlatformBrowser(this.platformId);
  readonly filtrosService = inject(FiltrosService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly cityInterestService = inject(CityInterestService);
  private readonly toastService = inject(ToastService);
  private readonly eventosService = inject(EventosService);

  isScrolled       = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused  = signal(false);
  isFilterOpen     = signal(false);
  isDateModalOpen  = signal(false);
  isCityOpen       = signal(false);
  cityPopoverPosition = signal<{ top: number; left: number } | null>(null);
  isProfilePopoverOpen = signal(false);
  showLogoutConfirm = signal(false);
  searchQuery      = signal('');
  searchResults    = signal<SearchResults | null>(null);
  searching        = signal(false);
  private readonly searchInput$ = new Subject<string>();

  resultCount  = signal<number | null>(null);
  countLoading = signal(false);
  private readonly countInput$ = new Subject<void>();

  cityInterestEmail      = signal('');
  cityInterestSubmitting = signal(false);
  cityInterestError      = signal<string | null>(null);

  readonly selectedCityName = computed(() => {
    const selected = this.filtrosService.filterCity();
    if (selected !== 'Todas') return selected;
    return this.filtrosService.cities()[0]?.name ?? 'tu ciudad';
  });

  navLinks = [
    { label: 'Explorar',      path: '/explorar'      },
    { label: 'Sesiones 1:1',  path: '/sesiones'      },
    { label: 'Profesionales', path: '/profesionales' },
    { label: 'Conocer gente', path: '/match-bienestar' },
  ];

  inspirationTags = [
    'Yoga',           'Meditación',
    'Baño de sonido', 'Baño de hielo',
    'Breathwork',     'Retiro',
  ];

  pendingWhen       = signal<string | null>(null);
  pendingCategories = signal<string[]>([]);
  pendingTypes      = signal<string[]>([]);
  pendingCity       = signal<string>('Todas');
  pendingTimeOfDay  = signal<string | null>(null);
  pendingModality   = signal<string | null>(null);
  pendingRecurrence = signal<string | null>(null);
  pendingPrice      = signal<string | null>(null);

  calendarView = signal<{ year: number; month: number } | null>(null);

  dateQuickOptions = ['Esta semana', 'Este finde', 'Próxima semana'];
  weekDayLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

  get whenOptions()     { return this.filtrosService.whenOptions; }
  get categoryOptions() { return this.filtrosService.categoryOptions; }
  get typeOptions()     { return this.filtrosService.typeOptions; }
  get cityOptions()     { return this.filtrosService.cityOptions; }
  get timeOptions()     { return this.filtrosService.timeOptions; }
  get modalityOptions() { return this.filtrosService.modalityOptions; }
  get recurrenceOptions() { return this.filtrosService.recurrenceOptions; }
  get priceOptions()    { return this.filtrosService.priceOptions; }

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

  readonly applyButtonLabel = computed(() => {
    if (this.countLoading()) return 'Buscando…';
    const total = this.resultCount();
    if (total === null) return 'Mostrar resultados →';
    return `Mostrar ${total} ${total === 1 ? 'resultado' : 'resultados'} →`;
  });

  readonly selectedDateKey = computed<string | null>(() => {
    const when = this.pendingWhen();
    if (!when?.startsWith('RANGO:')) return null;
    return when.split(':')[1] ?? null;
  });

  readonly calendarDays = computed<CalendarDayCell[]>(() => {
    const view = this.calendarView();
    if (!view) return [];
    const first = new Date(view.year, view.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(view.year, view.month, 1 - offset);
    const today = this.localDateKey(new Date());
    const selected = this.selectedDateKey();
    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = this.localDateKey(d);
      cells.push({
        date: key,
        day: d.getDate(),
        inMonth: d.getMonth() === view.month,
        isToday: key === today,
        isPast: key < today,
        isSelected: key === selected,
      });
    }
    return cells;
  });

  readonly monthLabel = computed(() => {
    const view = this.calendarView();
    if (!view) return '';
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' })
      .format(new Date(view.year, view.month, 1));
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${view.year}`;
  });

  readonly canGoToPrevMonth = computed(() => {
    const view = this.calendarView();
    if (!view) return false;
    const now = new Date();
    return view.year > now.getFullYear()
      || (view.year === now.getFullYear() && view.month > now.getMonth());
  });

  readonly dateButtonLabel = computed(() => {
    if (this.countLoading()) return 'Buscando…';
    const total = this.resultCount();
    if (total === null) return 'Mostrar experiencias';
    return `Mostrar ${total} ${total === 1 ? 'experiencia' : 'experiencias'}`;
  });

  readonly isCustomDatePending = computed(() => this.pendingWhen()?.startsWith('RANGO:') ?? false);

  readonly pendingDateChipLabel = computed(() => {
    const when = this.pendingWhen();
    if (!when?.startsWith('RANGO:')) return 'Elegir fecha';
    const [, from, to] = when.split(':');
    const fmt = (value: string) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
      .format(this.parseDateKey(value));
    return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  });

ngOnInit(): void {
    this.filtrosService.refreshCatalogs();
    if (this.isBrowser) {
      window.addEventListener('oona:open-filter', this.openFilterListener);
      window.addEventListener('oona:open-date-modal', this.openDatePickerListener);
    }

    this.searchInput$
      .pipe(
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

ngOnDestroy(): void {
  if (this.isBrowser) {
    window.removeEventListener('oona:open-filter', this.openFilterListener);
    window.removeEventListener('oona:open-date-modal', this.openDatePickerListener);
    document.body.style.overflow = '';
  }
}

  private readonly openFilterListener = () => this.openFilter();
  private readonly openDatePickerListener = () => this.openDatePickerFromEvent();
  private readonly overlayOpen = computed(() =>
    this.isFilterOpen() ||
    this.isDateModalOpen() ||
    this.isCityOpen() ||
    this.isMobileMenuOpen() ||
    this.showLogoutConfirm()
  );

  constructor() {
    effect(() => {
      if (this.isBrowser) {
        document.body.style.overflow = this.overlayOpen() ? 'hidden' : '';
      }
    });

    this.countInput$
      .pipe(
        tap(() => this.countLoading.set(true)),
        debounceTime(250),
        switchMap(() => {
          const params = this.filtrosService.buildEventFilterParams(this.pendingSnapshot());
          return this.eventosService.getEventos({ ...params, size: 1, sort: 'priceFrom,asc' }).pipe(
            map(page => page.totalElements ?? 0),
            catchError(() => of<number | null>(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(total => {
        this.countLoading.set(false);
        if (total !== null) {
          this.resultCount.set(total);
        }
      });
  }
  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) {
      this.isScrolled.set(window.scrollY > 10);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isDateModalOpen()) {
      this.isDateModalOpen.set(false);
      return;
    }
    this.isFilterOpen.set(false);
    this.isCityOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isSearchFocused.set(false);
    this.isProfilePopoverOpen.set(false);
    this.showLogoutConfirm.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.isProfilePopoverOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.header__profile-container') && !target.closest('.header__burger')) {
        this.isProfilePopoverOpen.set(false);
      }
    }
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(v => !v); }
  closeMobileMenu():  void { this.isMobileMenuOpen.set(false); }

  toggleCity(event?: MouseEvent): void {
    const opening = !this.isCityOpen();
    this.isCityOpen.set(opening);
    this.isFilterOpen.set(false);
    if (opening) {
      this.cityInterestError.set(null);
      this.cityInterestEmail.set(this.authService.currentUser()?.email ?? '');
      this.updateCityPopoverPosition(event?.currentTarget as HTMLElement | undefined);
    }
  }

  private updateCityPopoverPosition(button?: HTMLElement): void {
    // En móvil (<= 899px) el popover se muestra como banner de ancho completo
    // vía CSS (ver media query); no lo anclamos al botón en ese caso.
    if (!this.isBrowser || !button || window.innerWidth <= 899) {
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
    this.cityPopoverPosition.set({ top: rect.bottom + 8, left });
  }

  closeCity(): void {
    this.isCityOpen.set(false);
  }

  onCityInterestEmailInput(value: string): void {
    this.cityInterestEmail.set(value);
    if (this.cityInterestError()) this.cityInterestError.set(null);
  }

  submitCityInterest(): void {
    if (this.cityInterestSubmitting()) return;

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
    this.cityInterestService.registerInterest({ cityId: city.id, email }).subscribe({
      next: () => {
        this.cityInterestSubmitting.set(false);
        this.closeCity();
        this.toastService.success(`¡Genial! Hemos guardado tu interés por ${city.name}`);
      },
      error: err => {
        this.cityInterestSubmitting.set(false);
        const message = err?.error?.message || 'No se pudo registrar tu interés. Inténtalo de nuevo.';
        this.cityInterestError.set(message);
      },
    });
  }
  onSearchFocus():    void { this.isSearchFocused.set(true); }
  onSearchBlur():     void { setTimeout(() => this.isSearchFocused.set(false), 160); }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  resolveImage(url?: string | null, fallback = ''): string {
    return url ? resolveAssetUrl(url) : fallback;
  }

  formatSearchDate(value: string | null): string {
    if (!value) return 'Fecha por confirmar';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
      .format(new Date(value))
      .replace('.', '');
  }

  goToAllResults(): void {
    const query = this.searchQuery().trim();
    if (!query) return;
    this.closeSearch();
    this.router.navigate(['/explorar'], { queryParams: { q: query } });
  }

  selectSearchCategory(category: SearchCategoryMatch): void {
    this.filtrosService.filterCategories.set([category.name]);
    this.closeSearch();
    this.router.navigate(['/explorar']);
  }

  selectSearchEvent(event: EventCardResponse): void {
    this.closeSearch();
    this.router.navigate(['/evento', event.id]);
  }

  selectSearchSession(session: OneToOneServiceCardResponse): void {
    this.closeSearch();
    this.router.navigate(['/sesiones', session.id]);
  }

  selectSearchOrganizer(organizer: SpecialistProfileResponse): void {
    this.closeSearch();
    this.router.navigate(['/profesionales', organizer.slug]);
  }

  private closeSearch(): void {
    this.isSearchFocused.set(false);
    this.searchQuery.set('');
    this.searchResults.set(null);
  }

  toggleProfilePopover(): void {
    this.isProfilePopoverOpen.update(v => !v);
  }

  closeProfilePopover(): void {
    this.isProfilePopoverOpen.set(false);
  }

  openLogoutConfirm(): void {
    this.showLogoutConfirm.set(true);
    this.isProfilePopoverOpen.set(false);
  }

  getUserInitial(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    const name = user.username || user.email || 'U';
    return name.charAt(0).toUpperCase();
  }

  getUsername(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Usuario';
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Usuario';
  }

  get isProfessional(): boolean {
    return this.authService.roles.includes('PROFESSIONAL');
  }

  logout(): void {
    this.authService.logout();
    this.showLogoutConfirm.set(false);
    this.isProfilePopoverOpen.set(false);
    this.router.navigate(['/']);
  }

  selectInspiration(tag: string): void {
    this.onSearchInput(tag);
  }

  openFilter(): void {
    this.filtrosService.refreshCatalogs();
    this.pendingWhen.set(this.filtrosService.filterWhen());
    this.pendingCategories.set([...this.filtrosService.filterCategories()]);
    this.pendingTypes.set([...this.filtrosService.filterTypes()]);
    this.pendingCity.set(this.filtrosService.filterCity());
    this.pendingTimeOfDay.set(this.filtrosService.filterTimeOfDay());
    this.pendingModality.set(this.filtrosService.filterModality());
    this.pendingRecurrence.set(this.filtrosService.filterRecurrence());
    this.pendingPrice.set(this.filtrosService.filterPrice());
    this.isFilterOpen.set(true);
    this.isCityOpen.set(false);
    this.countInput$.next();
  }

  applyFilters(): void {
    this.commitPending();
    this.isFilterOpen.set(false);
    this.router.navigate(['/explorar'], { queryParamsHandling: 'preserve' });
  }

  closeFilter(): void {
    this.isFilterOpen.set(false);
  }


  private commitPending(): void {
    this.filtrosService.applySnapshot(this.pendingSnapshot());
    this.countInput$.next();
  }

  private pendingSnapshot(): FiltrosEstado {
    return {
      when: this.pendingWhen(),
      categories: this.pendingCategories(),
      types: this.pendingTypes(),
      city: this.pendingCity(),
      timeOfDay: this.pendingTimeOfDay(),
      modality: this.pendingModality(),
      recurrence: this.pendingRecurrence(),
      price: this.pendingPrice(),
    };
  }

  pendingSelectWhen(opt: string): void {
    this.pendingWhen.set(this.pendingWhen() === opt ? null : opt);
    this.commitPending();
  }

  pendingToggleCategory(cat: string): void {
    const c = this.pendingCategories();
    this.pendingCategories.set(c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat]);
    this.commitPending();
  }

  pendingToggleType(t: string): void {
    const c = this.pendingTypes();
    this.pendingTypes.set(c.includes(t) ? c.filter(x => x !== t) : [...c, t]);
    this.commitPending();
  }

  pendingSelectCity(city: string): void {
    this.pendingCity.set(city);
    this.commitPending();
  }

  pendingSelectTimeOfDay(t: string): void {
    this.pendingTimeOfDay.set(this.pendingTimeOfDay() === t ? null : t);
    this.commitPending();
  }

  pendingSelectModality(m: string): void {
    this.pendingModality.set(this.pendingModality() === m ? null : m);
    this.commitPending();
  }

  pendingSelectRecurrence(r: string): void {
    this.pendingRecurrence.set(this.pendingRecurrence() === r ? null : r);
    this.commitPending();
  }

  pendingSelectPrice(price: string): void {
    this.pendingPrice.set(this.pendingPrice() === price ? null : price);
    this.commitPending();
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
    this.isDateModalOpen.set(false);
    this.commitPending();
  }

  openDatePicker(): void {
    const when = this.pendingWhen();
    if (when?.startsWith('RANGO:')) {
      const selected = this.parseDateKey(when.split(':')[1]);
      this.calendarView.set({ year: selected.getFullYear(), month: selected.getMonth() });
    } else {
      const now = new Date();
      this.calendarView.set({ year: now.getFullYear(), month: now.getMonth() });
    }
    this.isDateModalOpen.set(true);
    this.countInput$.next();
  }
  openDatePickerFromEvent(): void {
    this.syncPendingFromService();
    this.openDatePicker();
  }

  private syncPendingFromService(): void {
    this.pendingWhen.set(this.filtrosService.filterWhen());
    this.pendingCategories.set([...this.filtrosService.filterCategories()]);
    this.pendingTypes.set([...this.filtrosService.filterTypes()]);
    this.pendingCity.set(this.filtrosService.filterCity());
    this.pendingTimeOfDay.set(this.filtrosService.filterTimeOfDay());
    this.pendingModality.set(this.filtrosService.filterModality());
    this.pendingRecurrence.set(this.filtrosService.filterRecurrence());
    this.pendingPrice.set(this.filtrosService.filterPrice());
  }
  closeDatePicker(): void {
    this.isDateModalOpen.set(false);
  }

  prevMonth(): void { this.shiftCalendarMonth(-1); }
  nextMonth(): void { this.shiftCalendarMonth(1); }

  selectCalendarDay(cell: CalendarDayCell): void {
    if (cell.isPast) return;
    this.pendingWhen.set(cell.isSelected ? null : `RANGO:${cell.date}:${cell.date}`);
    if (!cell.inMonth) {
      const d = this.parseDateKey(cell.date);
      this.calendarView.set({ year: d.getFullYear(), month: d.getMonth() });
    }
    this.commitPending();
  }

  selectDateQuick(option: string): void {
    this.pendingWhen.set(this.pendingWhen() === option ? null : option);
    this.commitPending();
  }

  clearDateSelection(): void {
    this.pendingWhen.set(null);
    this.commitPending();
  }

  applyDateSelection(): void {
    this.commitPending();
    this.isDateModalOpen.set(false);
    this.isFilterOpen.set(false);
    this.router.navigate(['/explorar'], { queryParamsHandling: 'preserve' });
  }

  private shiftCalendarMonth(delta: number): void {
    const view = this.calendarView();
    if (!view) return;
    const shifted = new Date(view.year, view.month + delta, 1);
    this.calendarView.set({ year: shifted.getFullYear(), month: shifted.getMonth() });
  }

  private localDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private parseDateKey(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
