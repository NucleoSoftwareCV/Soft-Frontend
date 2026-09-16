import { Component, computed, ElementRef, inject, ViewChild, signal, AfterViewInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { FiltrosService } from '../../../../services/filtros.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements AfterViewInit, OnDestroy {
  private readonly filters = inject(FiltrosService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly backgrounds = [
    '#DCE6CD', '#F6D7CE', '#CFE0EA', '#EADFB6', '#F2D2CF', '#F5DDC8',
    '#DAD4E9', '#E2DCF0', '#F0DDE7', '#E2E6C1', '#D2E6D6', '#F2DDDB',
    '#F4E1CB', '#DEDEE2',
  ];
  private readonly fallbackCategories = [
    { id: -1, name: 'Yoga', slug: 'yoga', emoji: '🧘' },
    { id: -2, name: 'Pilates', slug: 'pilates', emoji: '🤸' },
    { id: -3, name: 'Hielo y Breathwork', slug: 'hielo-y-breathwork', emoji: '🧊' },
    { id: -4, name: 'Arte y Creatividad', slug: 'arte-y-creatividad', emoji: '🎨' },
    { id: -5, name: 'Movimiento', slug: 'movimiento', emoji: '🏃' },
    { id: -6, name: 'Deporte', slug: 'deporte', emoji: '💪' },
    { id: -7, name: 'Meditación y Mindfulness', slug: 'meditacion-y-mindfulness', emoji: '🧠' },
    { id: -8, name: 'Sonido y Vibración', slug: 'sonido-y-vibracion', emoji: '🎵' },
    { id: -9, name: 'Espiritualidad y Energía', slug: 'espiritualidad-y-energia', emoji: '✨' },
    { id: -10, name: 'Nutrición y Cocina', slug: 'nutricion-y-cocina', emoji: '🥗' },
    { id: -11, name: 'Psicología', slug: 'psicologia', emoji: '🌱' },
  ];

  @ViewChild('trackWrap') private trackWrap?: ElementRef<HTMLElement>;
  @ViewChild('section') private section?: ElementRef<HTMLElement>;

  /** true cuando la barra ya quedó pegada bajo el header (sticky activo). */
  readonly isStuck = signal(false);

  private readonly onScrollOrResize = () => this.checkStuck();

  readonly categories = computed(() => {
    const catalog = this.filters.categories();
    const visibleCategories = catalog.length ? catalog : this.fallbackCategories;

    return visibleCategories.map((category, index) => ({
      ...category,
      emoji: category.emoji || '✨',
      background: this.backgrounds[index % this.backgrounds.length],
    }));
  });

  constructor() {
    // Refresca el catálogo cada vez que se muestra este widget, así las
    // ediciones hechas en el panel admin (activar/desactivar, renombrar...)
    // se reflejan sin depender de la carga inicial de la app.
    this.filters.refreshCatalogs();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('scroll', this.onScrollOrResize, { passive: true });
    window.addEventListener('resize', this.onScrollOrResize, { passive: true });
    this.checkStuck();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScrollOrResize);
      window.removeEventListener('resize', this.onScrollOrResize);
    }
  }

  /** Compara la posición real de la sección contra su `top` sticky vigente (varía por breakpoint). */
  private checkStuck(): void {
    const el = this.section?.nativeElement;
    if (!el) return;
    const stickyTop = parseFloat(getComputedStyle(el).top) || 0;
    const stuck = el.getBoundingClientRect().top <= stickyTop + 0.5;
    if (stuck !== this.isStuck()) {
      this.isStuck.set(stuck);
    }
  }

  selectCategory(name: string): void {
    this.filters.filterCategories.set([name]);
  }

  scrollTrack(direction: 1 | -1): void {
    this.trackWrap?.nativeElement.scrollBy({ left: direction * 280, behavior: 'smooth' });
  }
}
