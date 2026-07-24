import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfessionalFollowService } from '../../services/professional-follow.service';
import { FollowedProfessionalResponse } from '../../shared/models/professional-follow.model';
import { FavoritesService } from '../../services/favorites.service';
import { FavoriteResponse } from '../../shared/models/favorites.model';

type Seccion = 'perfil' | 'eventos' | 'dashboard';
type ModalStep = 'tipo' | 'sesion' | 'evento';
type ItemEstado = 'activo' | 'pausado' | 'cancelado';
type RangePrecio = 'gratis' | 'hasta15' | 'de15a30' | 'de30a50' | 'mas50';

interface ItemCreado {
  id: number;
  tipo: 'sesion' | 'evento';
  titulo: string;
  descripcion: string;
  precio: number;
  rangoPrecio: RangePrecio;
  fecha: string;
  cuando: string;
  categoria: string[];
  tipoExperiencia: string;
  ubicacion: string;
  horaDia: string;
  modalidad: string;
  recurrencia: string;
  direccion: string;
  plazas: number;
  plazasOcupadas: number;
  estado: ItemEstado;
  imagenes: string[];
  sesiones: { fecha: string; hora: string; plazas: number }[];
  asistentes: { nombre: string; email: string; fecha: string }[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly followService = inject(ProfessionalFollowService);
  readonly favoritesService = inject(FavoritesService);

  readonly favoritesDetails = signal<FavoriteResponse[]>([]);
  readonly favoritesLoading = signal(false);
  readonly favoritesError = signal<string | null>(null);

  seccionActiva = signal<Seccion>('perfil');
  readonly seccionCliente = signal<'reservas' | 'guardados' | 'siguiendo'>('reservas');
  readonly isProfessional = computed(() => this.authService.roles.includes('PROFESSIONAL') || this.authService.roles.includes('ADMIN'));
  readonly followedProfessionals = signal<FollowedProfessionalResponse[]>([]);
  readonly followingLoading = signal(false);
  readonly followingError = signal<string | null>(null);
  readonly followingPage = signal(0);
  readonly followingTotalPages = signal(0);
  readonly followingTotalElements = signal(0);
  readonly followingPageSize = 5;

  mostrarModal = signal(false);
  modalStep = signal<ModalStep>('tipo');
  editandoId = signal<number | null>(null);
  itemExpandido = signal<number | null>(null);
  dropdownAbierto = signal<string | null>(null);
  fechaDesde = signal('');
  fechaHasta = signal('');

  // Perfil
  nombre = signal('');
  email = signal('');
  telefono = signal('');
  bio = signal('');
  ubicacion = signal('');

  // Opciones
  categorias = [
    'Yoga', 'Hielo y Breathwork', 'Arte y Creatividad', 'Movimiento',
    'Deporte', 'Meditación y Mindfulness', 'Sonido y Vibración',
    'Espiritualidad y Energía', 'Nutrición y Cocina', 'Psicología',
    'Cuerpo y Salud', 'Maternidad y Familia', 'Emprendimiento',
  ];
  tiposExperiencia = ['Talleres', 'Retiros', 'Clases', 'Ceremonias', 'Encuentros Grupales', 'Formaciones'];
  cuandoOptions = ['Hoy', 'Mañana', 'Este finde', 'Esta semana', 'Próxima semana'];
  ubicaciones = ['Valencia', 'Alicante', 'Castellón', 'Barcelona', 'Madrid'];
  precioOptions: { label: string; value: RangePrecio }[] = [
    { label: 'Gratis', value: 'gratis' },
    { label: 'Hasta 15€', value: 'hasta15' },
    { label: '15–30€', value: 'de15a30' },
    { label: '30–50€', value: 'de30a50' },
    { label: 'Más de 50€', value: 'mas50' },
  ];
  horaOptions = [
    { label: 'Mañana', sub: '6h – 12h' },
    { label: 'Mediodía', sub: '12h – 16h' },
    { label: 'Tarde', sub: '16h – 20h' },
    { label: 'Noche', sub: '20h – 24h' },
  ];
  modalidadOptions = ['Presencial', 'Online'];
  recurrenciaOptions = ['Único', 'Recurrente'];
  plazasOptions = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100];

  // Form fields
  categoriasSeleccionadas = signal<string[]>([]);
  tipoExperiencia = signal('');
  cuando = signal('');
  fechaPersonalizada = signal('');
  ubicacionEvento = signal('');
  rangoPrecio = signal<RangePrecio>('gratis');
  horaDia = signal('');
  modalidad = signal('Presencial');
  recurrencia = signal('Único');
  plazas = signal(10);

  sesionTitulo = signal('');
  sesionDescripcion = signal('');
  sesionPrecio = signal(0);
  sesionDuracion = signal(60);

  eventoTitulo = signal('');
  eventoDescripcion = signal('');
  eventoPrecio = signal(0);
  eventoFecha = signal('');
  eventoHora = signal('');
  eventoDireccion = signal('');

  imagenesSubidas = signal<string[]>([]);
  sesionesConfig = signal<{ fecha: string; hora: string; plazas: number }[]>([]);

  items = signal<ItemCreado[]>([]);

  cambiarSeccionCliente(tab: 'reservas' | 'guardados' | 'siguiendo'): void {
    this.seccionCliente.set(tab);
    if (tab === 'siguiendo' && this.followedProfessionals().length === 0) {
      this.loadFollowedProfessionals(0);
    }
    if (tab === 'guardados') {
      this.loadFavoritesDetails();
    }
  }

  loadFavoritesDetails(): void {
    if (!this.authService.isLoggedIn) return;

    this.favoritesLoading.set(true);
    this.favoritesError.set(null);
    this.favoritesService.getFavorites().subscribe({
      next: data => {
        this.favoritesDetails.set(data);
        this.favoritesLoading.set(false);
      },
      error: () => {
        this.favoritesError.set('No pudimos cargar tus favoritos.');
        this.favoritesLoading.set(false);
      }
    });
  }

  removeFavorite(fav: FavoriteResponse, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggleFavorite(fav.entityType, fav.entityId).subscribe({
      next: () => {
        this.favoritesDetails.update(list => list.filter(item => !(item.entityType === fav.entityType && item.entityId === fav.entityId)));
      }
    });
  }

  formatDateTime(isoString?: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const formatted = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d).replace(',', ' •');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return '';
    }
  }

  loadFollowedProfessionals(page: number): void {
    if (!this.authService.isLoggedIn || page < 0 || this.followingLoading()) return;

    this.followingLoading.set(true);
    this.followingError.set(null);
    this.followService.getFollowedProfessionals(page, this.followingPageSize).subscribe({
      next: response => {
        this.followedProfessionals.set(response.content);
        this.followingPage.set(response.number);
        this.followingTotalPages.set(response.totalPages);
        this.followingTotalElements.set(response.totalElements);
        this.followingLoading.set(false);
      },
      error: () => {
        this.followingError.set('No pudimos cargar los profesionales que sigues.');
        this.followingLoading.set(false);
      },
    });
  }

  followingInitials(professional: FollowedProfessionalResponse): string {
    return professional.publicName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  profileCategoryLabel(category: string): string {
    const normalized = category.replaceAll('_', ' ').toLocaleLowerCase('es-ES');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  getUsername(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Usuario';
    return user.username || user.email.split('@')[0] || 'Usuario';
  }

  getUserInitial(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    const name = user.username || user.email || 'U';
    return name.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.items.set([...this.buildSampleData()]);
    this.loadFollowedProfessionals(0);
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'guardados') {
        this.cambiarSeccionCliente('guardados');
      } else if (tab === 'siguiendo') {
        this.cambiarSeccionCliente('siguiendo');
      } else if (tab === 'reservas') {
        this.cambiarSeccionCliente('reservas');
      }
    });
  }

  private buildSampleData(): ItemCreado[] {
    return [
      {
        id: 1, tipo: 'evento', titulo: 'Retiro de Yoga y Meditación en la Naturaleza',
        descripcion: 'Un fin de semana de desconexión total. Yoga al amanecer, meditaciones guiadas, baños de sonido y alimentación consciente. Incluye alojamiento y todas las comidas.',
        precio: 250, rangoPrecio: 'mas50', fecha: '2026-07-15', cuando: 'Este finde',
        categoria: ['Yoga', 'Meditación y Mindfulness', 'Sonido y Vibración'],
        tipoExperiencia: 'Retiros', ubicacion: 'Valencia', horaDia: 'Mañana',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: 'Ctra. de la Marina, Km 5', plazas: 20, plazasOcupadas: 14, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'],
        sesiones: [
          { fecha: '2026-07-15', hora: '08:00', plazas: 20 },
          { fecha: '2026-07-16', hora: '08:00', plazas: 20 },
          { fecha: '2026-07-17', hora: '08:00', plazas: 20 },
        ],
        asistentes: [
          { nombre: 'Marta García López', email: 'marta.garcia@email.com', fecha: '2026-06-20' },
          { nombre: 'Carlos Ruiz Molina', email: 'carlos.ruiz@email.com', fecha: '2026-06-21' },
          { nombre: 'Ana Belén Martínez', email: 'ana.martinez@email.com', fecha: '2026-06-22' },
          { nombre: 'Javier Fernández Soto', email: 'javier.fernandez@email.com', fecha: '2026-06-23' },
          { nombre: 'Laura Sánchez Pérez', email: 'laura.sanchez@email.com', fecha: '2026-06-24' },
          { nombre: 'Diego Romero Navarro', email: 'diego.romero@email.com', fecha: '2026-06-25' },
          { nombre: 'Sofía Hernández Crespo', email: 'sofia.hernandez@email.com', fecha: '2026-06-26' },
          { nombre: 'Pablo Morales Vega', email: 'pablo.morales@email.com', fecha: '2026-06-27' },
          { nombre: 'Elena Torres Aguilar', email: 'elena.torres@email.com', fecha: '2026-06-28' },
          { nombre: 'Alberto Jiménez Ruiz', email: 'alberto.jimenez@email.com', fecha: '2026-06-29' },
          { nombre: 'Carmen Ortega Díaz', email: 'carmen.ortega@email.com', fecha: '2026-07-01' },
          { nombre: 'Raúl Castro Medina', email: 'raul.castro@email.com', fecha: '2026-07-02' },
          { nombre: 'Isabel Romero Pascual', email: 'isabel.romero@email.com', fecha: '2026-07-03' },
          { nombre: 'Sergio Delgado Pastor', email: 'sergio.delgado@email.com', fecha: '2026-07-05' },
        ],
      },
      {
        id: 2, tipo: 'sesion', titulo: 'Terapia de Sonido Individual · Cuencos Tibetanos',
        descripcion: 'Sesión personalizada de sanación vibracional con cuencos tibetanos, gong y diapasones. Alineación de chakras y liberación de bloqueos energéticos.',
        precio: 65, rangoPrecio: 'mas50', fecha: new Date().toISOString(), cuando: 'Esta semana',
        categoria: ['Sonido y Vibración', 'Espiritualidad y Energía'],
        tipoExperiencia: 'Clases', ubicacion: 'Valencia', horaDia: 'Tarde',
        modalidad: 'Presencial', recurrencia: 'Recurrente', direccion: '', plazas: 1, plazasOcupadas: 1, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400'],
        sesiones: [
          { fecha: '2026-07-10', hora: '17:00', plazas: 1 },
          { fecha: '2026-07-17', hora: '17:00', plazas: 1 },
          { fecha: '2026-07-24', hora: '17:00', plazas: 1 },
        ],
        asistentes: [
          { nombre: 'Nuria Vidal Costa', email: 'nuria.vidal@email.com', fecha: '2026-07-01' },
        ],
      },
      {
        id: 3, tipo: 'evento', titulo: 'Taller de Respiración Consciente · Breathwork',
        descripcion: 'Aprende técnicas de respiración avanzadas para gestionar el estrés, mejorar tu concentración y conectar con tu cuerpo. Sesiones guiadas en grupo.',
        precio: 25, rangoPrecio: 'de15a30', fecha: '2026-07-22', cuando: 'Próxima semana',
        categoria: ['Hielo y Breathwork', 'Meditación y Mindfulness', 'Cuerpo y Salud'],
        tipoExperiencia: 'Talleres', ubicacion: 'Barcelona', horaDia: 'Noche',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: 'Carrer del Rosselló 142, local 3', plazas: 15, plazasOcupadas: 9, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400'],
        sesiones: [],
        asistentes: [
          { nombre: 'María Dolores Rubio', email: 'mdolores.rubio@email.com', fecha: '2026-07-10' },
          { nombre: 'Vicente Pallarés Gimeno', email: 'vicente.pallares@email.com', fecha: '2026-07-11' },
          { nombre: 'Rosa María Sanz López', email: 'rosa.sanz@email.com', fecha: '2026-07-12' },
          { nombre: 'Antonio García Ferrer', email: 'antonio.garcia@email.com', fecha: '2026-07-13' },
          { nombre: 'Teresa Navarro Piquer', email: 'teresa.navarro@email.com', fecha: '2026-07-14' },
          { nombre: 'Francisco Javier Molina', email: 'francisco.molina@email.com', fecha: '2026-07-15' },
          { nombre: 'Patricia Herrera Gil', email: 'patricia.herrera@email.com', fecha: '2026-07-16' },
          { nombre: 'Manuel Ortiz Campos', email: 'manuel.ortiz@email.com', fecha: '2026-07-17' },
          { nombre: 'Cristina Blasco Marín', email: 'cristina.blasco@email.com', fecha: '2026-07-18' },
        ],
      },
      {
        id: 4, tipo: 'sesion', titulo: 'Sesión de Constelaciones Familiares',
        descripcion: 'Constelación familiar individual para identificar y sanar patrones heredados que limitan tu vida. Trabajo profundo con movimientos sistémicos.',
        precio: 120, rangoPrecio: 'mas50', fecha: new Date().toISOString(), cuando: 'Hoy',
        categoria: ['Espiritualidad y Energía', 'Psicología'],
        tipoExperiencia: 'Ceremonias', ubicacion: 'Madrid', horaDia: 'Mañana',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: '', plazas: 1, plazasOcupadas: 1, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'],
        sesiones: [
          { fecha: '2026-07-08', hora: '10:00', plazas: 1 },
        ],
        asistentes: [
          { nombre: 'Lourdes Pascual Rico', email: 'lourdes.pascual@email.com', fecha: '2026-07-01' },
        ],
      },
      {
        id: 5, tipo: 'evento', titulo: 'Círculo de Mujeres · Luna Llena',
        descripcion: 'Encuentro sagrado de mujeres para conectar con la energía de la luna llena. Compartiremos ceremonias, meditación guiada, danza libre y té de cacao.',
        precio: 15, rangoPrecio: 'hasta15', fecha: '2026-07-28', cuando: 'Próxima semana',
        categoria: ['Espiritualidad y Energía', 'Meditación y Mindfulness', 'Arte y Creatividad'],
        tipoExperiencia: 'Encuentros Grupales', ubicacion: 'Alicante', horaDia: 'Noche',
        modalidad: 'Presencial', recurrencia: 'Recurrente', direccion: 'Playa de San Juan, junto al chiringuito 7', plazas: 30, plazasOcupadas: 22, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400'],
        sesiones: [
          { fecha: '2026-07-28', hora: '20:00', plazas: 30 },
        ],
        asistentes: [
          { nombre: 'Beatriz Coronado Vila', email: 'beatriz.coronado@email.com', fecha: '2026-07-18' },
          { nombre: 'Clara Montero Alegre', email: 'clara.montero@email.com', fecha: '2026-07-18' },
          { nombre: 'Eva María Latorre', email: 'eva.latorre@email.com', fecha: '2026-07-19' },
          { nombre: 'Gema Navarro Castillo', email: 'gema.navarro@email.com', fecha: '2026-07-19' },
          { nombre: 'Raquel Pla Moreno', email: 'raquel.pla@email.com', fecha: '2026-07-20' },
          { nombre: 'Inmaculada Crespo Ruiz', email: 'inma.crespo@email.com', fecha: '2026-07-20' },
          { nombre: 'Silvia Montañés García', email: 'silvia.montanes@email.com', fecha: '2026-07-21' },
          { nombre: 'Ángela Poveda López', email: 'angela.poveda@email.com', fecha: '2026-07-21' },
          { nombre: 'Rocío Fernández Vega', email: 'rocio.fernandez@email.com', fecha: '2026-07-22' },
          { nombre: 'Natalia Sevilla Mena', email: 'natalia.sevilla@email.com', fecha: '2026-07-22' },
          { nombre: 'Amparo Roca Fullana', email: 'amparo.roca@email.com', fecha: '2026-07-23' },
          { nombre: 'Mar Benítez Soler', email: 'mar.benitez@email.com', fecha: '2026-07-23' },
          { nombre: 'Esther Álamo López', email: 'esther.alamo@email.com', fecha: '2026-07-24' },
          { nombre: 'Miriam Sanjuan Ibáñez', email: 'miriam.sanjuan@email.com', fecha: '2026-07-24' },
          { nombre: 'Celia Peiró Andrés', email: 'celia.peiro@email.com', fecha: '2026-07-25' },
          { nombre: 'Ariadna Fuentes García', email: 'ariadna.fuentes@email.com', fecha: '2026-07-25' },
          { nombre: 'Noelia Martín Segura', email: 'noelia.martin@email.com', fecha: '2026-07-26' },
          { nombre: 'Lucía Ramírez Cuesta', email: 'lucia.ramirez@email.com', fecha: '2026-07-26' },
          { nombre: 'Paula Giner Martínez', email: 'paula.giner@email.com', fecha: '2026-07-27' },
          { nombre: 'Andrea Beltrán Costa', email: 'andrea.beltran@email.com', fecha: '2026-07-27' },
          { nombre: 'Sara Tomás Vidal', email: 'sara.tomas@email.com', fecha: '2026-07-27' },
          { nombre: 'Julia Caballero Ríos', email: 'julia.caballero@email.com', fecha: '2026-07-28' },
        ],
      },
      {
        id: 6, tipo: 'evento', titulo: 'Masterclass de Cocina Nutritiva · Alimentos que Sanan',
        descripcion: 'Aprende a cocinar platos deliciosos y nutritivos con ingredientes de temporada. Incluye degustación y recetario digital.',
        precio: 35, rangoPrecio: 'de30a50', fecha: '2026-08-05', cuando: 'Elegir fecha',
        categoria: ['Nutrición y Cocina', 'Cuerpo y Salud'],
        tipoExperiencia: 'Talleres', ubicacion: 'Castellón', horaDia: 'Mediodía',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: 'Av. de la Mar, 23', plazas: 12, plazasOcupadas: 7, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400'],
        sesiones: [],
        asistentes: [
          { nombre: 'José Ramón Beltrán', email: 'jr.beltran@email.com', fecha: '2026-07-20' },
          { nombre: 'Ángeles Muñoz Pardo', email: 'angeles.munoz@email.com', fecha: '2026-07-21' },
          { nombre: 'Daniel Gómez Ferrer', email: 'daniel.gomez@email.com', fecha: '2026-07-22' },
          { nombre: 'Mónica Valls Segura', email: 'monica.valls@email.com', fecha: '2026-07-23' },
          { nombre: 'Héctor Sanz Escrivá', email: 'hector.sanz@email.com', fecha: '2026-07-25' },
          { nombre: 'Cristina Aliaga Gómez', email: 'cristina.aliaga@email.com', fecha: '2026-07-27' },
          { nombre: 'Vicente Martínez Corella', email: 'vicente.martinez@email.com', fecha: '2026-07-28' },
        ],
      },
      {
        id: 7, tipo: 'sesion', titulo: 'Asesoría de Porteo Ergonómico',
        descripcion: 'Sesión individual para aprender a portear a tu bebé de forma segura y ergonómica. Probamos diferentes portabebés y resolvemos tus dudas.',
        precio: 60, rangoPrecio: 'mas50', fecha: new Date().toISOString(), cuando: 'Mañana',
        categoria: ['Maternidad y Familia', 'Cuerpo y Salud'],
        tipoExperiencia: 'Clases', ubicacion: 'Valencia', horaDia: 'Mañana',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: '', plazas: 1, plazasOcupadas: 0, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400'],
        sesiones: [
          { fecha: '2026-07-09', hora: '10:30', plazas: 1 },
        ],
        asistentes: [],
      },
      {
        id: 8, tipo: 'sesion', titulo: 'Lectura de Diseño Humano · Carta Completa',
        descripcion: 'Descubre tu diseño único: tipo, perfil, centros definidos e indefinidos, canales y puertas activadas. Sesión de 90 minutos con grabación.',
        precio: 150, rangoPrecio: 'mas50', fecha: new Date().toISOString(), cuando: 'Esta semana',
        categoria: ['Espiritualidad y Energía', 'Emprendimiento'],
        tipoExperiencia: 'Ceremonias', ubicacion: 'Online', horaDia: 'Tarde',
        modalidad: 'Online', recurrencia: 'Único', direccion: '', plazas: 1, plazasOcupadas: 0, estado: 'activo',
        imagenes: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400'],
        sesiones: [
          { fecha: '2026-07-11', hora: '16:00', plazas: 1 },
          { fecha: '2026-07-18', hora: '16:00', plazas: 1 },
        ],
        asistentes: [],
      },
      {
        id: 9, tipo: 'evento', titulo: 'Clase Abierta de Yoga para Embarazadas',
        descripcion: 'Yoga suave y adaptado para cada trimestre del embarazo. Trabajaremos respiración, posturas seguras y relajación para conectar con tu bebé.',
        precio: 0, rangoPrecio: 'gratis', fecha: '2026-07-12', cuando: 'Este finde',
        categoria: ['Yoga', 'Maternidad y Familia', 'Cuerpo y Salud'],
        tipoExperiencia: 'Clases', ubicacion: 'Barcelona', horaDia: 'Mañana',
        modalidad: 'Presencial', recurrencia: 'Recurrente', direccion: 'C/ de la Diputació 255, 1r 1a', plazas: 10, plazasOcupadas: 8, estado: 'pausado',
        imagenes: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
        sesiones: [
          { fecha: '2026-07-12', hora: '11:00', plazas: 10 },
          { fecha: '2026-07-19', hora: '11:00', plazas: 10 },
        ],
        asistentes: [
          { nombre: 'Alba Castelló Pons', email: 'alba.castello@email.com', fecha: '2026-07-01' },
          { nombre: 'Mireia Font Grau', email: 'mireia.font@email.com', fecha: '2026-07-02' },
          { nombre: 'Laia Soler Puig', email: 'laia.soler@email.com', fecha: '2026-07-03' },
          { nombre: 'Aina Rovira Mas', email: 'aina.rovira@email.com', fecha: '2026-07-04' },
          { nombre: 'Meritxell Casas Ribas', email: 'meritxell.casas@email.com', fecha: '2026-07-05' },
          { nombre: 'Aurora Mata López', email: 'aurora.mata@email.com', fecha: '2026-07-06' },
          { nombre: 'Gemma Puertas Mayor', email: 'gemma.puertas@email.com', fecha: '2026-07-07' },
          { nombre: 'Berta Carrión Esteve', email: 'berta.carrion@email.com', fecha: '2026-07-08' },
        ],
      },
      {
        id: 10, tipo: 'evento', titulo: 'Jornada de Puertas Abiertas · Centro OONA',
        descripcion: 'Ven a conocer nuestro espacio de bienestar. Clases demo gratuitas, sesiones express de 15 min, degustación de tés y sorteos. Trae a tus amigos.',
        precio: 0, rangoPrecio: 'gratis', fecha: '2026-08-01', cuando: 'Elegir fecha',
        categoria: ['Movimiento', 'Meditación y Mindfulness', 'Emprendimiento'],
        tipoExperiencia: 'Encuentros Grupales', ubicacion: 'Valencia', horaDia: 'Mañana',
        modalidad: 'Presencial', recurrencia: 'Único', direccion: 'C/ del Poeta Querol 10, bajo', plazas: 50, plazasOcupadas: 8, estado: 'cancelado',
        imagenes: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'],
        sesiones: [],
        asistentes: [
          { nombre: 'Hugo Sancho Verdi', email: 'hugo.sancho@email.com', fecha: '2026-07-20' },
          { nombre: 'Lydia Barberán Fort', email: 'lydia.barberan@email.com', fecha: '2026-07-21' },
          { nombre: 'Iván Morte Albalat', email: 'ivan.morte@email.com', fecha: '2026-07-22' },
          { nombre: 'Nadia Cherif Benali', email: 'nadia.cherif@email.com', fecha: '2026-07-23' },
          { nombre: 'Rubén Durán Lozano', email: 'ruben.duran@email.com', fecha: '2026-07-25' },
          { nombre: 'Alicia Montesinos Vidal', email: 'alicia.montesinos@email.com', fecha: '2026-07-26' },
          { nombre: 'Jordi Alcover García', email: 'jordi.alcover@email.com', fecha: '2026-07-27' },
          { nombre: 'Malena Costa Ribes', email: 'malena.costa@email.com', fecha: '2026-07-28' },
        ],
      },
    ];
  }

  // ── Helpers ──
  toggleCategoria(cat: string): void {
    const c = this.categoriasSeleccionadas();
    this.categoriasSeleccionadas.set(c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat]);
  }

  cambiarSeccion(s: Seccion): void { this.seccionActiva.set(s); }

  // ── Dropdown helpers ──
  toggleDropdown(name: string): void {
    this.dropdownAbierto.update(v => v === name ? null : name);
  }

  rangoPrecioLabel(): string {
    return this.precioOptions.find(p => p.value === this.rangoPrecio())?.label ?? 'Seleccionar';
  }

  categoriasLabel(): string {
    const sel = this.categoriasSeleccionadas();
    return sel.length > 2 ? `${sel.length} seleccionadas` : (sel.join(', ') || 'Seleccionar categorías');
  }

  cuandoLabel(): string {
    return this.cuando() || 'Seleccionar';
  }

  tipoExpLabel(): string {
    return this.tipoExperiencia() || 'Seleccionar';
  }

  abrirModal(): void { this.modalStep.set('tipo'); this.mostrarModal.set(true); this.editandoId.set(null); }
  cerrarModal(): void { this.mostrarModal.set(false); }
  elegirTipo(t: 'sesion' | 'evento'): void { this.modalStep.set(t); this.limpiarFormularios(); }
  volverATipo(): void { this.modalStep.set('tipo'); }

  toggleExpandir(id: number): void {
    this.itemExpandido.set(this.itemExpandido() === id ? null : id);
  }

  // ── Imágenes ──
  subirImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.imagenesSubidas.update(arr => [...arr, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  eliminarImagen(idx: number): void {
    this.imagenesSubidas.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── Sesiones ──
  agregarSesion(): void {
    this.sesionesConfig.update(arr => [...arr, { fecha: '', hora: '', plazas: 10 }]);
  }

  eliminarSesion(idx: number): void {
    this.sesionesConfig.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── Form helpers ──
  private fieldValue(tipo: 'sesion' | 'evento', field: string): any {
    if (tipo === 'sesion') {
      const map: any = { titulo: this.sesionTitulo, descripcion: this.sesionDescripcion, precio: this.sesionPrecio };
      return map[field]?.() ?? '';
    }
    const map: any = { titulo: this.eventoTitulo, descripcion: this.eventoDescripcion, precio: this.eventoPrecio, fecha: this.eventoFecha };
    return map[field]?.() ?? '';
  }

  private fieldSet(tipo: 'sesion' | 'evento', field: string, val: any): void {
    if (tipo === 'sesion') {
      const map: any = { titulo: this.sesionTitulo, descripcion: this.sesionDescripcion, precio: this.sesionPrecio };
      map[field]?.set(val);
    } else {
      const map: any = { titulo: this.eventoTitulo, descripcion: this.eventoDescripcion, precio: this.eventoPrecio, fecha: this.eventoFecha };
      map[field]?.set(val);
    }
  }

  private limpiarFormularios(): void {
    this.categoriasSeleccionadas.set([]);
    this.tipoExperiencia.set('');
    this.cuando.set('');
    this.fechaPersonalizada.set('');
    this.ubicacionEvento.set('');
    this.rangoPrecio.set('gratis');
    this.horaDia.set('');
    this.modalidad.set('Presencial');
    this.recurrencia.set('Único');
    this.plazas.set(10);
    this.sesionTitulo.set(''); this.sesionDescripcion.set(''); this.sesionPrecio.set(0); this.sesionDuracion.set(60);
    this.eventoTitulo.set(''); this.eventoDescripcion.set(''); this.eventoPrecio.set(0); this.eventoFecha.set('');
    this.eventoHora.set(''); this.eventoDireccion.set('');
    this.imagenesSubidas.set([]);
    this.sesionesConfig.set([]);
  }

  // ── Guardar perfil ──
  guardarPerfil(): void {
    console.log('Perfil guardado', {
      nombre: this.nombre(), email: this.email(), telefono: this.telefono(),
      bio: this.bio(), ubicacion: this.ubicacion(), categorias: this.categoriasSeleccionadas(),
    });
  }

  // ── Crear / Editar ──
  private buildItem(tipo: 'sesion' | 'evento'): ItemCreado {
    const editId = this.editandoId();
    const existente = editId ? this.items().find(i => i.id === editId) : undefined;
    return {
      id: editId ?? Date.now(),
      tipo,
      titulo: tipo === 'sesion' ? this.sesionTitulo() : this.eventoTitulo(),
      descripcion: tipo === 'sesion' ? this.sesionDescripcion() : this.eventoDescripcion(),
      precio: tipo === 'sesion' ? this.sesionPrecio() : this.eventoPrecio(),
      rangoPrecio: this.rangoPrecio(),
      fecha: tipo === 'evento' ? this.eventoFecha() : new Date().toISOString(),
      cuando: this.cuando(),
      categoria: this.categoriasSeleccionadas(),
      tipoExperiencia: this.tipoExperiencia(),
      ubicacion: this.ubicacionEvento(),
      horaDia: this.horaDia(),
      modalidad: this.modalidad(),
      recurrencia: this.recurrencia(),
      direccion: tipo === 'evento' ? this.eventoDireccion() : '',
      plazas: this.plazas(),
      plazasOcupadas: existente?.plazasOcupadas ?? 0,
      estado: existente?.estado ?? 'activo',
      imagenes: this.imagenesSubidas().length ? this.imagenesSubidas() : existente?.imagenes ?? [],
      sesiones: this.sesionesConfig().length ? this.sesionesConfig() : existente?.sesiones ?? [],
      asistentes: existente?.asistentes ?? [],
    };
  }

  crearSesion(): void {
    if (!this.sesionTitulo()) return;
    const item = this.buildItem('sesion');
    if (this.editandoId()) {
      this.items.update(arr => arr.map(i => i.id === this.editandoId() ? item : i));
    } else {
      this.items.update(arr => [item, ...arr]);
    }
    this.cerrarModal();
  }

  crearEvento(): void {
    if (!this.eventoTitulo()) return;
    const item = this.buildItem('evento');
    if (this.editandoId()) {
      this.items.update(arr => arr.map(i => i.id === this.editandoId() ? item : i));
    } else {
      this.items.update(arr => [item, ...arr]);
    }
    this.cerrarModal();
  }

  editarItem(item: ItemCreado): void {
    this.editandoId.set(item.id);
    this.modalStep.set(item.tipo);
    this.mostrarModal.set(true);
    this.categoriasSeleccionadas.set([...item.categoria]);
    this.tipoExperiencia.set(item.tipoExperiencia);
    this.cuando.set(item.cuando);
    this.ubicacionEvento.set(item.ubicacion);
    this.rangoPrecio.set(item.rangoPrecio);
    this.horaDia.set(item.horaDia);
    this.modalidad.set(item.modalidad);
    this.recurrencia.set(item.recurrencia);
    this.plazas.set(item.plazas);
    this.imagenesSubidas.set([...item.imagenes]);
    this.sesionesConfig.set([...item.sesiones]);
    if (item.tipo === 'sesion') {
      this.sesionTitulo.set(item.titulo);
      this.sesionDescripcion.set(item.descripcion);
      this.sesionPrecio.set(item.precio);
      this.sesionDuracion.set(60);
    } else {
      this.eventoTitulo.set(item.titulo);
      this.eventoDescripcion.set(item.descripcion);
      this.eventoPrecio.set(item.precio);
      this.eventoFecha.set(item.fecha);
      this.eventoHora.set('');
      this.eventoDireccion.set(item.direccion);
    }
  }

  // ── Acciones ──
  cambiarEstado(id: number, estado: ItemEstado): void {
    this.items.update(arr => arr.map(i => i.id === id ? { ...i, estado } : i));
  }

  cancelarExperiencia(id: number): void {
    if (confirm('¿Seguro que quieres cancelar esta experiencia?')) {
      this.cambiarEstado(id, 'cancelado');
    }
  }

  togglePausar(item: ItemCreado): void {
    this.cambiarEstado(item.id, item.estado === 'pausado' ? 'activo' : 'pausado');
  }

  // ── Asistentes simulados ──
  simularAsistente(id: number): void {
    this.items.update(arr => arr.map(i => {
      if (i.id !== id) return i;
      const ocupadas = i.plazasOcupadas + 1;
      return {
        ...i,
        plazasOcupadas: Math.min(ocupadas, i.plazas),
        asistentes: [...i.asistentes, {
          nombre: 'Asistente ' + (i.asistentes.length + 1),
          email: `asistente${i.asistentes.length + 1}@email.com`,
          fecha: new Date().toISOString(),
        }],
      };
    }));
  }

  // ── Dashboard ──
  itemsFiltrados = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const all = this.items();
    if (!desde && !hasta) return all;
    return all.filter(i => {
      const f = i.fecha ? new Date(i.fecha) : null;
      if (!f) return true;
      if (desde && f < new Date(desde)) return false;
      if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
      return true;
    });
  });

  totalAsistentes = computed(() =>
    this.itemsFiltrados().reduce((s, i) => s + i.asistentes.length, 0)
  );

  estadoCounts = computed(() => {
    const items = this.itemsFiltrados();
    return {
      activos: items.filter(i => i.estado === 'activo').length,
      pausados: items.filter(i => i.estado === 'pausado').length,
      cancelados: items.filter(i => i.estado === 'cancelado').length,
    };
  });

  tipoCounts = computed(() => {
    const items = this.itemsFiltrados();
    return {
      sesiones: items.filter(i => i.tipo === 'sesion').length,
      eventos: items.filter(i => i.tipo === 'evento').length,
    };
  });

  topCategorias = computed(() => {
    const map = new Map<string, number>();
    this.itemsFiltrados().forEach(i => i.categoria.forEach(c => map.set(c, (map.get(c) ?? 0) + 1)));
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const colors = ['#004257', '#4c8c2a', '#f39c12', '#3498db', '#9b59b6', '#1abc9c'];
    return sorted.map(([label, value], idx) => ({ label, value, color: colors[idx] || '#ccc' }));
  });

  estadoPieGradient = computed(() =>
    this.buildConic([
      { label: 'Activos', value: this.estadoCounts().activos, color: '#4c8c2a' },
      { label: 'Pausados', value: this.estadoCounts().pausados, color: '#f39c12' },
      { label: 'Cancelados', value: this.estadoCounts().cancelados, color: '#c0392b' },
    ])
  );

  tipoPieGradient = computed(() =>
    this.buildConic([
      { label: 'Sesiones', value: this.tipoCounts().sesiones, color: '#004257' },
      { label: 'Eventos', value: this.tipoCounts().eventos, color: '#3498db' },
    ])
  );

  categoriaPieGradient = computed(() =>
    this.buildConic(this.topCategorias())
  );

  private buildConic(segments: { label: string; value: number; color: string }[]): string {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return 'conic-gradient(#e2e8f1 0%, #e2e8f1 100%)';
    let cum = 0;
    const parts = segments.map(seg => {
      const s = cum;
      const e = cum + (seg.value / total) * 100;
      cum = e;
      return `${seg.color} ${s}% ${e}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  todosAsistentes = computed(() =>
    this.itemsFiltrados().flatMap(i =>
      i.asistentes.map(a => ({ ...a, experienciaTitulo: i.titulo }))
    )
  );

  limpiarFiltros(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
