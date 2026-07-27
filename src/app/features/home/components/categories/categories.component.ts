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
    { label: 'Yoga',                   path: '/eventos/yoga',           emoji: '🧘', bg: '#DCE6CD' },
    { label: 'Pilates',                path: '/eventos/pilates',        emoji: '🤸', bg: '#F6D7CE' },
    { label: 'Hielo y\nBreathwork',    path: '/eventos/breathwork',     emoji: '🧊', bg: '#CFE0EA' },
    { label: 'Arte y\nCreatividad',    path: '/eventos/arte',           emoji: '🎨', bg: '#EADFB6' },
    { label: 'Movimiento',             path: '/eventos/movimiento',     emoji: '🏃', bg: '#F2D2CF' },
    { label: 'Deporte',                path: '/eventos/deporte',        emoji: '💪', bg: '#F5DDC8' },
    { label: 'Meditación y\nMindfulness', path: '/eventos/meditacion', emoji: '🧠', bg: '#DAD4E9' },
    { label: 'Sonido y\nVibración',    path: '/eventos/sonido',         emoji: '🎵', bg: '#E2DCF0' },
    { label: 'Espiritualidad y\nEnergía', path: '/eventos/espiritualidad', emoji: '✨', bg: '#F0DDE7' },
    { label: 'Nutrición y\nCocina',    path: '/eventos/nutricion',      emoji: '🥗', bg: '#E2E6C1' },
    { label: 'Psicología',             path: '/eventos/psicologia',     emoji: '🌱', bg: '#D2E6D6' },
    { label: 'Cuerpo y Salud',         path: '/eventos/cuerpo',         emoji: '💆', bg: '#F2DDDB' },
    { label: 'Maternidad y\nFamilia',  path: '/eventos/maternidad',     emoji: '🤰', bg: '#F4E1CB' },
    { label: 'Emprendimiento',         path: '/eventos/emprendimiento', emoji: '🚀', bg: '#DEDEE2' },
  ];
}
