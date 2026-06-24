import { Component, signal, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  searchQuery     = signal('');
  isSearchFocused = signal(false);
  city            = signal('Valencia');

  /** Emite hacia el HomeComponent para abrir el modal de filtros del Header */
  openFilter = output<void>();

  inspirationTags = [
    'Yoga',           'Meditación',
    'Baño de sonido', 'Baño de hielo',
    'Breathwork',     'Retiro',
  ];

  onFocus(): void { this.isSearchFocused.set(true); }
  onBlur():  void { setTimeout(() => this.isSearchFocused.set(false), 180); }

  selectTag(tag: string): void {
    this.searchQuery.set(tag);
    this.isSearchFocused.set(false);
  }
}
