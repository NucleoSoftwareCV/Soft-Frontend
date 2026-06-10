import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Category {
  label: string;
  path:  string;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent {
  categories: Category[] = [
    { label: 'Yoga',            path: '/eventos/yoga',          emoji: '🧘',  color: '#5c7a5e' },
    { label: 'Meditación',      path: '/eventos/meditacion',    emoji: '🌿',  color: '#7a9e7e' },
    { label: 'Breathwork',      path: '/eventos/breathwork',    emoji: '🌬️',  color: '#8aab8c' },
    { label: 'Cacao',           path: '/eventos/cacao',         emoji: '☕',  color: '#a06b4a' },
    { label: 'Baño de sonido',  path: '/eventos/sonido',        emoji: '🔔',  color: '#c49a6c' },
    { label: 'Retiros',         path: '/eventos/retiros',       emoji: '🏕️',  color: '#d4856a' },
    { label: 'Ayurveda',        path: '/eventos/ayurveda',      emoji: '🌸',  color: '#b87a9e' },
    { label: 'Talleres',        path: '/eventos/talleres',      emoji: '✨',  color: '#7a8aab' },
  ];
}
