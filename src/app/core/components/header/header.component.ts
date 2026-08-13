import { Component, HostListener, signal, computed, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FiltrosService } from '../../../services/filtros.service';
import { AuthService } from '../../services/auth.service';
import { SearchCategoryMatch, SearchResults, SearchService } from '../../../services/search.service';
import { EventCardResponse } from '../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../shared/models/one-to-one-service.model';
import { SpecialistProfileResponse } from '../../../services/profesionales.service';
import { resolveAssetUrl } from '../../../shared/utils/asset-url.util';
import { CityInterestService } from '../../../services/city-interest.service';
import { ToastService } from '../../../shared/services/toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  isScrolled       = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused  = signal(false);
  isFilterOpen     = signal(false);
  isCityOpen       = signal(false);
  cityPopoverPosition = signal<{ top: number; left: number } | null>(null);
  isProfilePopoverOpen = signal(false);
  showLogoutConfirm = signal(false);
  searchQuery      = signal('');
  searchResults    = signal<SearchResults | null>(null);
  searching        = signal(false);
  private readonly searchInput$ = new Subject<string>();

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

  get whenOptions()     { return this.filtrosService.whenOptions; }
  get categoryOptions() { return this.filtrosService.categoryOptions; }
  get typeOptions()     { return this.filtrosService.typeOptions; }
  get cityOptions()     { return this.filtrosService.cityOptions; }
  get timeOptions()     { return this.filtrosService.timeOptions; }
  get modalityOptions() { return this.filtrosService.modalityOptions; }
  get recurrenceOptions() { return this.filtrosService.recurrenceOptions; }

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
      (this.pendingRecurrence() ? 1 : 0)
    );
  }

  ngOnInit(): void {
    this.filtrosService.refreshCatalogs();
    if (this.isBrowser) {
      window.addEventListener('oona:open-filter', this.openFilterListener);
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
    }
  }

  private readonly openFilterListener = () => this.openFilter();

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isBrowser) {
      this.isScrolled.set(window.scrollY > 10);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isFilterOpen.set(false);
    this.isCityOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isSearchFocused.set(false);
    this.isProfilePopoverOpen.set(false);
    this.showLogoutConfirm.set(false);
  }

  @HostListener('document:click', ['$event'])
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
    this.isFilterOpen.set(true);
    this.isCityOpen.set(false);
  }

  applyFilters(): void {
    this.filtrosService.filterWhen.set(this.pendingWhen());
    this.filtrosService.filterCategories.set([...this.pendingCategories()]);
    this.filtrosService.filterTypes.set([...this.pendingTypes()]);
    this.filtrosService.filterCity.set(this.pendingCity());
    this.filtrosService.filterTimeOfDay.set(this.pendingTimeOfDay());
    this.filtrosService.filterModality.set(this.pendingModality());
    this.filtrosService.filterRecurrence.set(this.pendingRecurrence());
    this.isFilterOpen.set(false);
  }

  closeFilter(): void {
    this.isFilterOpen.set(false);
  }

  pendingSelectWhen(opt: string): void {
    this.pendingWhen.set(this.pendingWhen() === opt ? null : opt);
  }

  pendingToggleCategory(cat: string): void {
    const c = this.pendingCategories();
    this.pendingCategories.set(c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat]);
  }

  pendingToggleType(t: string): void {
    const c = this.pendingTypes();
    this.pendingTypes.set(c.includes(t) ? c.filter(x => x !== t) : [...c, t]);
  }

  pendingSelectCity(city: string): void {
    this.pendingCity.set(city);
  }

  pendingSelectTimeOfDay(t: string): void {
    this.pendingTimeOfDay.set(this.pendingTimeOfDay() === t ? null : t);
  }

  pendingSelectModality(m: string): void {
    this.pendingModality.set(this.pendingModality() === m ? null : m);
  }

  pendingSelectRecurrence(r: string): void {
    this.pendingRecurrence.set(this.pendingRecurrence() === r ? null : r);
  }

  pendingClearFilters(): void {
    this.pendingWhen.set(null);
    this.pendingCategories.set([]);
    this.pendingTypes.set([]);
    this.pendingCity.set('Todas');
    this.pendingTimeOfDay.set(null);
    this.pendingModality.set(null);
    this.pendingRecurrence.set(null);
  }
}
