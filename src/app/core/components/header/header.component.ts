import { Component, HostListener, signal, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  isScrolled       = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused  = signal(false);
  isFilterOpen     = signal(false);
  isCityOpen       = signal(false);
  searchQuery      = signal('');

  navLinks = [
    { label: 'Explorar',      path: '/explorar'      },
    { label: 'Sesiones 1:1',  path: '/sesiones'      },
    { label: 'Profesionales', path: '/profesionales' },
    { label: 'Conocer gente', path: '/conocer-gente' },
  ];

  inspirationTags = [
    'Yoga',           'Meditación',
    'Baño de sonido', 'Baño de hielo',
    'Breathwork',     'Retiro',
  ];

  /* Filtros */
  filterWhen       = signal<string | null>(null);
  filterCategories = signal<string[]>([]);
  filterTypes      = signal<string[]>([]);
  filterCity       = signal<string>('Todas');
  filterTimeOfDay  = signal<string | null>(null);
  filterModality   = signal<string | null>(null);
  filterRecurrence = signal<string | null>(null);

  whenOptions     = ['Hoy', 'Mañana', 'Este finde', 'Esta semana', 'Próxima semana'];
  categoryOptions = [
    'Yoga', 'Hielo y Breathwork', 'Arte y Creatividad', 'Movimiento',
    'Deporte', 'Meditación y Mindfulness', 'Sonido y Vibración',
    'Espiritualidad y Energía', 'Nutrición y Cocina', 'Psicología',
    'Cuerpo y Salud', 'Maternidad y Familia', 'Emprendimiento',
  ];
  typeOptions     = ['Talleres', 'Retiros', 'Clases', 'Ceremonias', 'Encuentros Grupales', 'Formaciones'];
  cityOptions     = ['Todas', 'Valencia', 'Alicante', 'Castellón', 'Barcelona', 'Madrid'];
  timeOptions     = [
    { label: 'Mañana',   sub: '6h – 12h'  },
    { label: 'Mediodía', sub: '12h – 16h' },
    { label: 'Tarde',    sub: '16h – 20h' },
    { label: 'Noche',    sub: '20h – 24h' },
  ];
  modalityOptions   = ['Presencial', 'Online'];
  recurrenceOptions = ['Único', 'Recurrente'];

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

  /** Listener del evento global emitido por el hero */
  private readonly openFilterListener = () => this.openFilter();

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
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(v => !v); }
  closeMobileMenu():  void { this.isMobileMenuOpen.set(false); }
  openFilter():       void { this.isFilterOpen.set(true); this.isCityOpen.set(false); }
  closeFilter():      void { this.isFilterOpen.set(false); }
  toggleCity():       void { this.isCityOpen.update(v => !v); this.isFilterOpen.set(false); }
  closeCity():        void { this.isCityOpen.set(false); }
  onSearchFocus():    void { this.isSearchFocused.set(true); }
  onSearchBlur():     void { setTimeout(() => this.isSearchFocused.set(false), 160); }

  selectInspiration(tag: string): void {
    this.searchQuery.set(tag);
    this.isSearchFocused.set(false);
  }

  selectWhen(opt: string): void {
    this.filterWhen.set(this.filterWhen() === opt ? null : opt);
  }
  toggleCategory(cat: string): void {
    const c = this.filterCategories();
    this.filterCategories.set(c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat]);
  }
  toggleType(t: string): void {
    const c = this.filterTypes();
    this.filterTypes.set(c.includes(t) ? c.filter(x => x !== t) : [...c, t]);
  }
  selectCity(city: string):    void { this.filterCity.set(city); }
  selectTimeOfDay(t: string):  void { this.filterTimeOfDay.set(this.filterTimeOfDay() === t ? null : t); }
  selectModality(m: string):   void { this.filterModality.set(this.filterModality() === m ? null : m); }
  selectRecurrence(r: string): void { this.filterRecurrence.set(this.filterRecurrence() === r ? null : r); }

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
