import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FiltrosService } from '../../../../services/filtros.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent {
  private readonly filters = inject(FiltrosService);
  private readonly backgrounds = [
    '#DCE6CD', '#F6D7CE', '#CFE0EA', '#EADFB6', '#F2D2CF', '#F5DDC8',
    '#DAD4E9', '#E2DCF0', '#F0DDE7', '#E2E6C1', '#D2E6D6', '#F2DDDB',
    '#F4E1CB', '#DEDEE2',
  ];

  @ViewChild('trackWrap') private trackWrap?: ElementRef<HTMLElement>;

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

  selectCategory(name: string): void {
    this.filters.filterCategories.set([name]);
  }

  scrollTrack(direction: 1 | -1): void {
    this.trackWrap?.nativeElement.scrollBy({ left: direction * 280, behavior: 'smooth' });
  }
}
