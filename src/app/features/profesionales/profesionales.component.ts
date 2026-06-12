import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TarjetaDirectorio {
  id: number;
  tipo: 'Profesional' | 'Centro' | 'Organizador de eventos';
  badgeIcon: string;
  nombre: string;
  ubicacion: string;
  ubicacionCompleta?: string;
  cita: string;
  bio?: string;
  tags: string[];
  imagenUrl?: string;
  bannerUrl?: string;
  isLogoStyle?: boolean;
  logoMarca?: string;
  logoSub?: string;
  temas?: string[];
  tecnicas?: string[];
}

@Component({
  selector: 'app-profesionales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profesionales.component.html',
  styleUrl: './profesionales.component.css',
})
export class ProfesionalesComponent {

  categoriaActiva = signal<string>('todos');
  searchQuery = signal<string>('');
  perfilSeleccionado = signal<TarjetaDirectorio | null>(null);

  private readonly listado = signal<TarjetaDirectorio[]>([
    {
      id: 1,
      tipo: 'Profesional',
      badgeIcon: '👨‍🎓',
      nombre: 'Daria Roszak',
      ubicacion: 'Valencia',
      ubicacionCompleta: 'Valencia, España',
      cita: 'Soy psiconutricionista holística especializada en hambre emocional, comer compulsivo, equilibrio vital y maternar-te...',
      bio: 'Soy psiconutricionista holística especializada en hambre emocional, comer compulsivo y equilibrio vital. Acompaño a mujeres que quieren sanar su relación con la comida desde un enfoque integral que conecta cuerpo, mente y emoción.',
      tags: ['hambre emocional', 'comer compulsivo', 'parches emocion...', 'psiconutrición', '+2'],
      imagenUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      bannerUrl: 'https://cdn.euroinnova.edu.es/img/subidasEditor/copia%20de%20disen%CC%83o%20sin%20ti%CC%81tulo%20(55)-1621262627.webp',
      temas: ['NUTRICIÓN', 'BIENESTAR', 'EMOCIONES', 'MINDFULNESS'],
      tecnicas: ['PSICONUTRICIÓN', 'MINDFUL EATING', 'EFT TAPPING', 'COACHING NUTRICIONAL'],
    },
    {
      id: 2,
      tipo: 'Profesional',
      badgeIcon: '👨‍🎓',
      nombre: 'Marta Soro Psicología',
      ubicacion: 'Valencia',
      ubicacionCompleta: 'Valencia, España',
      cita: 'Acompaño a personas a dejar de sentirse insuficientes y a reconocer su propio valor incondicional...',
      bio: 'Psicóloga especializada en autoestima, terapia integradora y bienestar emocional. Acompaño a personas a dejar de sentirse insuficientes y a reconocer su propio valor incondicional a través de un proceso terapéutico profundo y personalizado.',
      tags: ['Autoestima', 'Merecimiento', 'Bienestar emoc...', 'Terapia integrad...', '+2'],
      imagenUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
      bannerUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1300&q=80',
      temas: ['AUTOESTIMA', 'BIENESTAR EMOCIONAL', 'ANSIEDAD', 'RELACIONES'],
      tecnicas: ['TERAPIA INTEGRADORA', 'EMDR', 'ACT', 'MINDFULNESS', 'TERAPIA COGNITIVO-CONDUCTUAL'],
    },
    {
      id: 3,
      tipo: 'Profesional',
      badgeIcon: '👨‍🎓',
      nombre: 'Lourdes Iniesta',
      ubicacion: 'Valencia',
      ubicacionCompleta: 'Valencia, San Jose de Calasanz 18 pta 4',
      cita: 'Acompaño a las mujeres en su viaje hacia una vida bella, hacia la belleza interior y exterior.',
      bio: 'Health Beauty Coach, Facialista, Naturopata, Quiromasajista y Reflexologa. Creadora del método FACE THERAPY y Fundadora de LOU cosmética natural.',
      tags: ['SALUD', 'BELLEZA', 'BIENESTAR', 'FACE THERAPY', 'REFLEXOLOGIA ...', '+10'],
      imagenUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500',
      bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1300&q=80',
      temas: ['SALUD', 'BELLEZA', 'BIENESTAR', 'NUTRICION', 'MINDFULNESS'],
      tecnicas: ['FACE THERAPY', 'REFLEXOLOGIA PODAL', 'QUIROMAJE', 'YOGA FACIAL', 'TRATAMIENTOS DERMICOS', 'ONCOESTETICA', 'NATUROPATIA', 'NUTRICION ENERGETICA', 'ELECTROACUPUNTURA DE VOLL', 'ECOCOSMETICA', 'FOLRES DE BACH', 'MINDFULNESS'],
    },
    {
      id: 4,
      tipo: 'Centro',
      badgeIcon: '🏬',
      nombre: 'Despacio mia',
      ubicacion: 'Almoradí, Almoradí, Calle...',
      ubicacionCompleta: 'Almoradí, Calle Mayor 12, Alicante',
      cita: 'Centro de bienestar holístico, yoga integral y cuidado consciente.',
      bio: 'Despacio Mia es un espacio de bienestar holístico en Almoradí donde el tiempo se detiene. Ofrecemos clases de yoga, pilates y grupos reducidos para que puedas conectar contigo mismo en un entorno cálido y consciente.',
      tags: ['Pilates', 'Yoga', 'preparto', 'Grupos reducidos', 'entreno personal'],
      isLogoStyle: true,
      logoMarca: 'd·espacio',
      logoSub: 'mia',
      bannerUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1300&q=80',
      temas: ['YOGA', 'PILATES', 'BIENESTAR', 'MATERNIDAD'],
      tecnicas: ['YOGA INTEGRAL', 'PILATES', 'PREPARTO', 'ENTRENO PERSONAL', 'GRUPOS REDUCIDOS'],
    }
  ]);

  perfilesFiltrados = computed(() => {
    const categoria = this.categoriaActiva();
    const query = this.searchQuery().toLowerCase().trim();

    return this.listado().filter(p => {
      const matchCategoria =
        categoria === 'todos' ||
        (categoria === 'profesionales' && p.tipo === 'Profesional') ||
        (categoria === 'centros' && p.tipo === 'Centro') ||
        (categoria === 'organizadores' && p.tipo === 'Organizador de eventos');

      const matchQuery =
        !query ||
        p.nombre.toLowerCase().includes(query) ||
        p.ubicacion.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query));

      return matchCategoria && matchQuery;
    });
  });

  actualizarCategoria(cat: string): void {
    this.categoriaActiva.set(cat);
  }

  actualizarBusqueda(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  verPerfil(perfil: TarjetaDirectorio): void {
    this.perfilSeleccionado.set(perfil);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlDirectorio(): void {
    this.perfilSeleccionado.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}