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

  @ViewChild('trackWrap') private trackWrap?: ElementRef<HTMLElement>;
  @ViewChild('section') private section?: ElementRef<HTMLElement>;

  /** true cuando la barra ya quedó pegada bajo el header (sticky activo). */
  readonly isStuck = signal(false);

  private readonly onScrollOrResize = () => this.checkStuck();

  readonly categories = computed(() =>
    this.filters.categories().map((category, index) => ({
      ...category,
      emoji: category.emoji || '✨',
      background: this.backgrounds[index % this.backgrounds.length],
    }))
  );

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
