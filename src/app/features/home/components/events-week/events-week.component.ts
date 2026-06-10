import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface EventCard {
  id:          number;
  title:       string;
  time:        string;
  recurrent:   boolean;
  location:    string;
  host:        string;
  hostAvatar:  string;
  image:       string;
  spotsLeft:   number | null;
  date:        string | null; /* null = "MAÑANA" */
}

@Component({
  selector: 'app-events-week',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './events-week.component.html',
  styleUrl:    './events-week.component.css',
})
export class EventsWeekComponent {
  /** Ícono seleccionado en el filtro de la barra superior */
  selectedCategory = signal<string | null>(null);

  /** Categorías del filtro visual (mismas de categories) */
  filterIcons = [
    { label: 'Yoga',          emoji: '🧘', bg: '#d4e8c2' },
    { label: 'Breathwork',    emoji: '🧊', bg: '#c2dce8' },
    { label: 'Arte',          emoji: '🎨', bg: '#f5ddc2' },
    { label: 'Movimiento',    emoji: '🏃', bg: '#f5c2c2' },
    { label: 'Deporte',       emoji: '🥊', bg: '#f5e8c2' },
    { label: 'Meditación',    emoji: '🧠', bg: '#dcc2f5' },
    { label: 'Sonido',        emoji: '🎵', bg: '#e0c2f5' },
    { label: 'Energía',       emoji: '✨', bg: '#f5c2e8' },
    { label: 'Nutrición',     emoji: '🥗', bg: '#c2e8d4' },
    { label: 'Psicología',    emoji: '🌱', bg: '#d4e8c2' },
    { label: 'Cuerpo',        emoji: '🧖', bg: '#f5d4c2' },
    { label: 'Familia',       emoji: '👶', bg: '#f5ecc2' },
    { label: 'Emprendimiento',emoji: '🚀', bg: '#c2d4f5' },
  ];

  events: EventCard[] = [
    {
      id: 1,
      title:      'Retiro de Higiene Energética — Recupera tu Energía y Vuelve a...',
      time:       'MAÑANA · 02:00',
      recurrent:  false,
      location:   'Valencia',
      host:       'Illanith Benjamin',
      hostAvatar: 'https://i.pravatar.cc/40?img=1',
      image:      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      spotsLeft:  null,
      date:       null,
    },
    {
      id: 2,
      title:      'Yoga Aéreo. Una experiencia que te reta',
      time:       'MAÑANA · 10:00',
      recurrent:  true,
      location:   'Valencia',
      host:       'Ruth Reyna Vidal',
      hostAvatar: 'https://i.pravatar.cc/40?img=2',
      image:      'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=600&auto=format&fit=crop&q=80',
      spotsLeft:  5,
      date:       null,
    },
    {
      id: 3,
      title:      'Pilates Aéreo. Llevas tu cuerpo a otro nivel',
      time:       'MAÑANA · 10:00',
      recurrent:  true,
      location:   'Valencia',
      host:       'Ruth Reyna Vidal',
      hostAvatar: 'https://i.pravatar.cc/40?img=3',
      image:      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      spotsLeft:  null,
      date:       null,
    },
    {
      id: 4,
      title:      'Yoga Flow (Vinyasa)',
      time:       '03:30',
      recurrent:  true,
      location:   'Valencia',
      host:       'Ruth Reyna Vidal',
      hostAvatar: 'https://i.pravatar.cc/40?img=4',
      image:      'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&auto=format&fit=crop&q=80',
      spotsLeft:  null,
      date:       'LUN 15 JUN',
    },
  ];

  selectCategory(label: string): void {
    this.selectedCategory.set(
      this.selectedCategory() === label ? null : label
    );
  }
}
