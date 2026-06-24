import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Professional {
  id:        number;
  role:      'PROFESIONAL' | 'ORGANIZADORA' | 'CENTRO';
  name:      string;
  location:  string;
  avatar:    string;
  tags:      string[];
  extraTags: number;
}

@Component({
  selector: 'app-professionals-grid',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './professionals-grid.component.html',
  styleUrl:    './professionals-grid.component.css',
})
export class ProfessionalsGridComponent {
  readonly features = [
    {
      icon: 'shield',
      title: 'Profesionales, centros y organizadores seleccionados',
      desc:  'Revisamos cada perfil para asegurar que encaja con una forma de vivir el bienestar cuidada y de confianza.',
    },
    {
      icon: 'pin',
      title: 'Experiencias cerca de ti',
      desc:  'Encuentra sesiones, talleres y actividades presenciales u online para cuidarte a tu ritmo.',
    },
    {
      icon: 'leaf',
      title: 'Yoga, breathwork, meditación, terapias y más',
      desc:  'Descubre diferentes prácticas de bienestar y elige el profesional que mejor encaje contigo.',
    },
  ] as const;

  readonly professionals: Professional[] = [
    { id: 1, role: 'ORGANIZADORA', name: 'Sofoco',              location: 'Valencia', avatar: 'https://i.pravatar.cc/80?img=5',  tags: ['pilates', 'barre'],              extraTags: 9  },
    { id: 2, role: 'PROFESIONAL',  name: 'Gema Horcajada Ortiz',location: 'Valencia', avatar: 'https://i.pravatar.cc/80?img=9',  tags: ['Gestión emocional','Autoconocimiento'], extraTags: 30 },
    { id: 3, role: 'CENTRO',       name: 'Nude Studio',         location: 'Valencia', avatar: 'https://i.pravatar.cc/80?img=11', tags: ['Yoga', 'Pilates'],               extraTags: 5  },
    { id: 4, role: 'PROFESIONAL',  name: 'Laurine Pigeau',      location: 'Valencia', avatar: 'https://i.pravatar.cc/80?img=20', tags: ['Nutrición integrativa','naturopatía'], extraTags: 16 },
  ];
}
