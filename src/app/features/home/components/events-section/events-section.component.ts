import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface EventCard {
  id:       number;
  title:    string;
  category: string;
  date:     string;
  time:     string;
  location: string;
  price:    string;
  image:    string;
}

@Component({
  selector: 'app-events-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './events-section.component.html',
  styleUrl: './events-section.component.css',
})
export class EventsSectionComponent {
  events: EventCard[] = [
    {
      id:       1,
      title:    'Clase de Yoga Vinyasa',
      category: 'Yoga',
      date:     'Sáb, 14 Jun',
      time:     '9:00 – 10:30',
      location: 'Madrid, Malasaña',
      price:    '18 €',
      image:    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=560&auto=format&fit=crop&q=80',
    },
    {
      id:       2,
      title:    'Taller de Breathwork y Liberación Emocional',
      category: 'Breathwork',
      date:     'Dom, 15 Jun',
      time:     '11:00 – 13:30',
      location: 'Barcelona, Gràcia',
      price:    '35 €',
      image:    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=560&auto=format&fit=crop&q=80',
    },
    {
      id:       3,
      title:    'Meditación Guiada con Cuencos Tibetanos',
      category: 'Baño de sonido',
      date:     'Lun, 16 Jun',
      time:     '19:00 – 20:30',
      location: 'Valencia, Centro',
      price:    '22 €',
      image:    'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=560&auto=format&fit=crop&q=80',
    },
    {
      id:       4,
      title:    'Ceremonia de Cacao y Canto',
      category: 'Cacao',
      date:     'Vie, 20 Jun',
      time:     '18:30 – 21:00',
      location: 'Sevilla, Triana',
      price:    '28 €',
      image:    'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=560&auto=format&fit=crop&q=80',
    },
  ];
}
