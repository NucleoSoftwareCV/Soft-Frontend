import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Professional {
  id:         number;
  name:       string;
  specialty:  string;
  location:   string;
  rating:     number;
  reviews:    number;
  image:      string;
  tags:       string[];
}

@Component({
  selector: 'app-professionals-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './professionals-section.component.html',
  styleUrl: './professionals-section.component.css',
})
export class ProfessionalsSectionComponent {
  professionals: Professional[] = [
    {
      id:        1,
      name:      'Ana García',
      specialty: 'Profesora de Yoga · Meditación',
      location:  'Madrid',
      rating:    4.9,
      reviews:   84,
      image:     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      tags:      ['Yoga', 'Meditación', 'Prenatal'],
    },
    {
      id:        2,
      name:      'Marcos Vidal',
      specialty: 'Facilitador de Breathwork',
      location:  'Barcelona',
      rating:    5.0,
      reviews:   62,
      image:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      tags:      ['Breathwork', 'ICM', 'Holotropic'],
    },
    {
      id:        3,
      name:      'Lucía Moreno',
      specialty: 'Terapeuta Ayurvédica',
      location:  'Valencia',
      rating:    4.8,
      reviews:   47,
      image:     'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      tags:      ['Ayurveda', 'Masajes', 'Herbología'],
    },
    {
      id:        4,
      name:      'Javier Ruiz',
      specialty: 'Maestro de Cuencos Tibetanos',
      location:  'Sevilla',
      rating:    4.9,
      reviews:   39,
      image:     'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      tags:      ['Sonido', 'Cuencos', 'Retiros'],
    },
  ];

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }
}
