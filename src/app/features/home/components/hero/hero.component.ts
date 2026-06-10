import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  searchQuery     = signal('');
  isSearchFocused = signal(false);
  city            = signal('Valencia');

  inspirationTags = [
    'Yoga',          'Meditación',
    'Baño de sonido','Baño de hielo',
    'Breathwork',    'Retiro',
  ];

  onFocus():  void { this.isSearchFocused.set(true); }
  onBlur():   void { setTimeout(() => this.isSearchFocused.set(false), 180); }

  selectTag(tag: string): void {
    this.searchQuery.set(tag);
    this.isSearchFocused.set(false);
  }
}
