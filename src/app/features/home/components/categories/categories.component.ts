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


  @ViewChild('trackWrap') private trackWrap?: ElementRef<HTMLElement>;
  @ViewChild('section') private section?: ElementRef<HTMLElement>;

  /** true cuando la barra ya quedó pegada bajo el header (sticky activo). */
  readonly isStuck = signal(false);

  private readonly onScrollOrResize = () => this.checkStuck();

  readonly categories = computed(() =>
    this.filters.categories().map(category => ({
      ...category,
      photo: this.categoryPhoto(category.slug, category.name),
    }))
  );

  /** Local generated photographs; slug and name keep the live catalogue editable. */
  private categoryPhoto(slug: string | null | undefined, name: string) {
    const value = ((slug ?? '') + ' ' + name).normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (value.includes('arte') || value.includes('creatividad')) return 'assets/images/categories/photos-v1/arte-creatividad';
    if (value.includes('cuerpo') || value.includes('salud')) return 'assets/images/categories/photos-v1/cuerpo-salud';
    if (value.includes('deporte')) return 'assets/images/categories/photos-v1/deporte';
    if (value.includes('emprendimiento')) return 'assets/images/categories/photos-v1/emprendimiento';
    if (value.includes('espiritualidad') || value.includes('energia')) return 'assets/images/categories/photos-v1/espiritualidad-energia';
    if (value.includes('hielo') || value.includes('breathwork')) return 'assets/images/categories/photos-v1/hielo-breathwork';
    if (value.includes('maternidad') || value.includes('familia')) return 'assets/images/categories/photos-v1/maternidad-familia';
    if (value.includes('meditacion') || value.includes('mindfulness')) return 'assets/images/categories/photos-v1/meditacion-mindfulness';
    if (value.includes('movimiento') || value.includes('pilates')) return 'assets/images/categories/photos-v1/movimiento';
    if (value.includes('nutricion') || value.includes('cocina')) return 'assets/images/categories/photos-v1/nutricion-cocina';
    if (value.includes('psicologia')) return 'assets/images/categories/photos-v1/psicologia';
    if (value.includes('sonido') || value.includes('vibracion')) return 'assets/images/categories/photos-v1/sonido-vibracion';
    if (value.includes('yoga')) return 'assets/images/categories/photos-v1/yoga';
    return 'assets/images/categories/photos-v1/bienestar';
  }

  useFallbackPhoto(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallback']) return;
    image.dataset['fallback'] = 'true';
    image.srcset = '';
    image.src = 'assets/images/categories/photos-v1/bienestar.webp';
  }

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
