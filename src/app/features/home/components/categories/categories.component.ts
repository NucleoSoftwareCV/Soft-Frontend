import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Category {
  label: string;
  path:  string;
  emoji: string;
  bg:    string; /* color de fondo del icono */
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
    { label: 'Yoga',                   path: '/eventos/yoga',          emoji: '🧘',  bg: '#d4e8c2' },
    { label: 'Hielo y\nBreathwork',    path: '/eventos/breathwork',    emoji: '🧊',  bg: '#c2dce8' },
    { label: 'Arte y\nCreatividad',    path: '/eventos/arte',          emoji: '🎨',  bg: '#f5ddc2' },
    { label: 'Movimiento',             path: '/eventos/movimiento',    emoji: '🏃',  bg: '#f5c2c2' },
    { label: 'Deporte',                path: '/eventos/deporte',       emoji: '🥊',  bg: '#f5e8c2' },
    { label: 'Meditación y\nMindfulness', path: '/eventos/meditacion', emoji: '🧠',  bg: '#dcc2f5' },
    { label: 'Sonido y\nVibración',    path: '/eventos/sonido',        emoji: '🎵',  bg: '#e0c2f5' },
    { label: 'Espiritualidad y\nEnergía', path: '/eventos/espiritualidad', emoji: '✨', bg: '#f5c2e8' },
    { label: 'Nutrición y\nCocina',    path: '/eventos/nutricion',     emoji: '🥗',  bg: '#c2e8d4' },
    { label: 'Psicología',             path: '/eventos/psicologia',    emoji: '🌱',  bg: '#d4e8c2' },
    { label: 'Cuerpo y Salud',         path: '/eventos/cuerpo',        emoji: '🧖',  bg: '#f5d4c2' },
  ];
}
