import { Component, HostListener, signal, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FiltrosService } from '../../../services/filtros.service';
import { AuthService } from '../../services/auth.service';

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

  isScrolled       = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused  = signal(false);
  isFilterOpen     = signal(false);
  isCityOpen       = signal(false);
  isProfilePopoverOpen = signal(false);
  showLogoutConfirm = signal(false);
  searchQuery      = signal('');

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
    if (this.isBrowser) {
      window.addEventListener('oona:open-filter', this.openFilterListener);
    }
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
  onClickOutside(event: Event): void {
    if (this.isProfilePopoverOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.header__profile-container')) {
        this.isProfilePopoverOpen.set(false);
      }
    }
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(v => !v); }
  closeMobileMenu():  void { this.isMobileMenuOpen.set(false); }
  toggleCity():       void { this.isCityOpen.update(v => !v); this.isFilterOpen.set(false); }
  closeCity():        void { this.isCityOpen.set(false); }
  onSearchFocus():    void { this.isSearchFocused.set(true); }
  onSearchBlur():     void { setTimeout(() => this.isSearchFocused.set(false), 160); }

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
    this.searchQuery.set(tag);
    this.isSearchFocused.set(false);
  }

  openFilter(): void {
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
