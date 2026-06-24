import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Sesion {
  id: number;
  titulo: string;
  profesional: string;
  precio: number;
  duracion: number;
  imagen: string;
  imagenes?: string[];
  temas: string[];
  tipos: string[];
  modalidad?: string;
  descripcion?: string;
  puedeAyudarCon?: string[];
  tecnicas?: string[];
  ubicacion?: string;
  whatsapp?: string;
  instagram?: string;
  email?: string;
  web?: string;
  telefono?: string;
}

@Component({
  selector: 'app-sesion-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sesion-detalle.html',
  styleUrls: ['./sesion-detalle.css']
})
export class SesionDetalleComponent implements OnInit {

  sesion: Sesion | undefined;
  imagenActiva: number = 0;

  todasLasSesiones: Sesion[] = [
    {
      id: 1,
      titulo: 'Asesoría porteo ergonómico',
      profesional: 'Sara Sevilla Mena',
      precio: 60,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
      imagenes: [
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
        'https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=800',
      ],
      temas: ['Bienestar'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Una sesión personalizada de asesoría sobre porteo ergonómico para bebés y familias. Aprenderás a portear de forma segura y cómoda tanto para ti como para tu bebé.\n\nResolveremos todas tus dudas sobre portadores, fulares y mochilas, y encontraremos juntos la mejor opción para vuestra situación particular.\n\nIdeal para familias que quieren iniciarse en el porteo o que tienen dudas sobre cómo mejorar su técnica actual.',
      puedeAyudarCon: ['Bienestar', 'Maternidad', 'Crianza'],
      tecnicas: ['Asesoría personalizada'],
      whatsapp: '+34600000001',
      instagram: 'sarasevilla',
      web: 'https://sarasevilla.com'
    },
    {
      id: 2,
      titulo: 'Identifica la herida de infancia que está condicionando tus relaciones',
      profesional: 'Marta Soro Psicología',
      precio: 70,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
      imagenes: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
      ],
      temas: ['Autoestima', 'Resiliencia'],
      tipos: ['Psicoterapia'],
      modalidad: 'Online',
      descripcion: '¿Por qué siempre repites la misma historia en el amor?\n\nMuchas veces no repetimos patrones por casualidad. Detrás suele haber una herida emocional o un aprendizaje relacional adquirido a lo largo de nuestra historia como mecanismo de protección.\n\nEn esta sesión descubriremos qué aprendizaje está condicionando tu forma de vincularte, qué dinámicas se repiten en tus relaciones y cómo empezar a transformarlas.\n\nIdeal para personas que desean comprender de una vez por todas por qué repiten siempre la misma historia, por qué tienden a vincularse con el mismo tipo de personas o sienten que viven experiencias amorosas fallidas en bucle.\n\nJuntos daremos sentido a esos patrones para que dejen de elegir por ti.',
      puedeAyudarCon: ['Autoestima', 'Claridad', 'Bienestar'],
      tecnicas: ['Psicoterapia'],
      whatsapp: '+34600000002',
      instagram: 'martasoro',
      email: 'hola@martasoro.com',
      web: 'https://martasoro.com'
    },
    {
      id: 3,
      titulo: 'Baño de sonido para parejas · Sound Healing',
      profesional: 'Ram Peris',
      precio: 80,
      duracion: 120,
      imagen: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      imagenes: [
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
        'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=800',
      ],
      temas: ['Energía', 'Bienestar'],
      tipos: ['Terapia'],
      modalidad: 'Presencial',
      ubicacion: 'https://maps.app.goo.gl/9qatoj632nRBrKeY9',
      descripcion: 'Sesión de baño de sonido para parejas, enfocada en la relajación profunda, la conexión y la armonización a través del sonido.\n\nUn espacio creado para compartir una experiencia de calma y presencia junto a tu pareja, donde el sonido se convierte en una herramienta para bajar el ritmo, liberar tensiones y fortalecer la conexión desde un lugar más consciente.\n\nEs una experiencia suave y no invasiva, donde no necesitáis hacer nada más que tumbaros, respirar y dejaros sostener por el sonido.\n\n¿Qué podéis esperar?\nUna sensación de calma profunda, relajación física y mental, mayor conexión entre vosotros y un espacio compartido de presencia y bienestar.\n\n¿Para quién es?\nPara parejas que quieran compartir un momento especial, reconectar, celebrar una ocasión, reducir el estrés o simplemente vivir una experiencia diferente de relajación juntos.\n\n¿Qué incluye la sesión?\n• Acompañamiento personalizado para ambos\n• Baño de sonido adaptado a la energía y necesidades de la pareja\n• Cuencos tibetanos, handpan, gong y otros instrumentos de vibración sonora en directo\n• Experiencia vibracional sobre o alrededor del cuerpo\n• Espacio de relajación, conexión y reconexión compartida',
      puedeAyudarCon: ['Bienestar', 'Energía', 'Claridad', 'Estrés', 'Insomnio'],
      tecnicas: ['Sonoterapia'],
      whatsapp: '+34600000003',
      instagram: 'ramperis',
      web: 'https://ramperis.com'
    },
    {
      id: 4,
      titulo: 'Constelación individual. Desbloquea lo que te impide avanzar.',
      profesional: 'Fanny Sánchez Armisén',
      precio: 100,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      temas: ['Propósito', 'Autoestima'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Una sesión profunda de constelaciones familiares individuales para identificar y liberar los bloqueos que te impiden avanzar en tu vida.\n\nA través de este proceso, exploraremos los patrones familiares y ancestrales que pueden estar influyendo en tu presente, abriendo espacio para una nueva comprensión y movimiento.',
      puedeAyudarCon: ['Propósito', 'Autoestima', 'Claridad'],
      tecnicas: ['Constelaciones familiares'],
      whatsapp: '+34600000004',
      instagram: 'fannysa'
    },
    {
      id: 5,
      titulo: 'Café Aromático',
      profesional: 'Anett Oravecz',
      precio: 15,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      temas: ['Bienestar'],
      tipos: ['Terapia'],
      modalidad: 'Presencial',
      descripcion: 'Una experiencia sensorial única alrededor del café y la aromaterapia. Descubre cómo los aromas pueden influir en tu estado de ánimo y bienestar.',
      puedeAyudarCon: ['Bienestar', 'Relajación'],
      tecnicas: ['Aromaterapia'],
      whatsapp: '+34600000005'
    },
    {
      id: 6,
      titulo: 'ÉTERUM FLOW EXPERIENCE',
      profesional: 'Xus Montaner Pelufo',
      precio: 50,
      duracion: 90,
      imagen: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      temas: ['Energía'],
      tipos: ['Yoga'],
      modalidad: 'Presencial',
      descripcion: 'Una experiencia de yoga fluido y trabajo energético que te conecta con tu esencia más profunda.',
      puedeAyudarCon: ['Energía', 'Concentración', 'Bienestar'],
      tecnicas: ['Yoga', 'Trabajo energético'],
      whatsapp: '+34600000006'
    },
    {
      id: 7,
      titulo: 'DESCUBRE TU PIEL | Asesoría Personalizada con Cosmética Fresca',
      profesional: 'Raquel Romero Juárez',
      precio: 0,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      temas: ['Bienestar'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Sesión gratuita de asesoría personalizada de cosmética natural y fresca. Descubre cuáles son los productos más adecuados para tu tipo de piel.',
      puedeAyudarCon: ['Bienestar', 'Autoestima'],
      tecnicas: ['Asesoría cosmética'],
      whatsapp: '+34600000007'
    },
    {
      id: 8,
      titulo: 'EMBARAZO | Acompañamiento emocional para atravesarlo sin que...',
      profesional: 'Ana Laura Vital',
      precio: 40,
      duracion: 90,
      imagen: 'https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=800',
      temas: ['Bienestar', 'Resiliencia'],
      tipos: ['Psicoterapia'],
      modalidad: 'Online',
      descripcion: 'Acompañamiento emocional durante el embarazo para atravesar esta etapa con más calma, confianza y recursos emocionales.',
      puedeAyudarCon: ['Bienestar', 'Resiliencia', 'Maternidad'],
      tecnicas: ['Psicoterapia'],
      whatsapp: '+34600000008'
    },
    {
      id: 9,
      titulo: 'Sesión breathwork individual · Respiración consciente 1:1',
      profesional: 'Ram Peris',
      precio: 50,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=800',
      temas: ['Energía', 'Concentración'],
      tipos: ['Respiración'],
      modalidad: 'Presencial',
      descripcion: 'Sesión individual de breathwork o respiración consciente. Una práctica poderosa para liberar tensiones, conectar con tu cuerpo y expandir tu energía vital.',
      puedeAyudarCon: ['Energía', 'Concentración', 'Estrés'],
      tecnicas: ['Breathwork', 'Respiración consciente'],
      whatsapp: '+34600000003'
    },
    {
      id: 10,
      titulo: 'Baño de sonido individual · Sound Healing 1:1',
      profesional: 'Ram Peris',
      precio: 50,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
      temas: ['Bienestar', 'Energía'],
      tipos: ['Terapia'],
      modalidad: 'Presencial',
      descripcion: 'Sesión individual de baño de sonido para una experiencia profunda y personalizada de sanación sonora.',
      puedeAyudarCon: ['Bienestar', 'Energía', 'Insomnio'],
      tecnicas: ['Sonoterapia'],
      whatsapp: '+34600000003'
    },
    {
      id: 11,
      titulo: 'Terapia Holística',
      profesional: 'Ana Laura Vital',
      precio: 35,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800',
      temas: ['Bienestar'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Sesión de terapia holística que integra cuerpo, mente y espíritu para un bienestar integral.',
      puedeAyudarCon: ['Bienestar', 'Equilibrio', 'Energía'],
      tecnicas: ['Terapia holística'],
      whatsapp: '+34600000008'
    },
    {
      id: 12,
      titulo: 'Tarot Terapéutico | Lecturas personalizadas.',
      profesional: 'Ana Laura Vital',
      precio: 30,
      duracion: 45,
      imagen: 'https://images.unsplash.com/photo-1551269901-5c40c8dd8fb1?w=800',
      temas: ['Propósito'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Lectura de tarot terapéutico con enfoque en el autoconocimiento y la toma de decisiones consciente.',
      puedeAyudarCon: ['Propósito', 'Claridad', 'Autoestima'],
      tecnicas: ['Tarot terapéutico'],
      whatsapp: '+34600000008'
    },
    {
      id: 13,
      titulo: 'Meditación sensible al trauma',
      profesional: 'Pausa, Salud',
      precio: 12,
      duracion: 30,
      imagen: 'https://images.unsplash.com/photo-1506126279646-a697353d3166?w=800',
      temas: ['Resiliencia', 'Bienestar'],
      tipos: ['Yoga'],
      modalidad: 'Online',
      descripcion: 'Sesión de meditación adaptada para personas que han vivido experiencias traumáticas, con un enfoque suave y respetuoso.',
      puedeAyudarCon: ['Resiliencia', 'Bienestar', 'Estrés'],
      tecnicas: ['Meditación', 'Mindfulness'],
      whatsapp: '+34600000009'
    },
    {
      id: 14,
      titulo: 'Sesiones de hipnosis clínica y la terapia cognitivo conductual.',
      profesional: 'Pausa, Salud',
      precio: 80,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1591343395902-1adcb454c4e2?w=800',
      temas: ['Concentración', 'Motivación'],
      tipos: ['Psicoterapia'],
      modalidad: 'Online',
      descripcion: 'Combinación de hipnosis clínica y TCC para abordar patrones de pensamiento limitantes y crear cambios profundos y duraderos.',
      puedeAyudarCon: ['Concentración', 'Motivación', 'Ansiedad'],
      tecnicas: ['Hipnosis clínica', 'Terapia cognitivo conductual'],
      whatsapp: '+34600000009'
    },
    {
      id: 15,
      titulo: 'Lectura Diseño Humano',
      profesional: 'Cristina Jiménez',
      precio: 150,
      duracion: 90,
      imagen: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=800',
      temas: ['Propósito', 'Autoestima'],
      tipos: ['Terapia'],
      modalidad: 'Online',
      descripcion: 'Lectura personalizada de tu carta de Diseño Humano para comprender tu naturaleza única, tu estrategia y autoridad de vida.',
      puedeAyudarCon: ['Propósito', 'Autoestima', 'Claridad'],
      tecnicas: ['Diseño Humano'],
      whatsapp: '+34600000010'
    },
    {
      id: 16,
      titulo: 'VUELVE A SENTIR, a través de una inmersión somática personalizada',
      profesional: 'Muriel Toutant',
      precio: 150,
      duracion: 120,
      imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      temas: ['Resiliencia', 'Energía'],
      tipos: ['Terapia'],
      modalidad: 'Presencial',
      descripcion: 'Inmersión somática personalizada para reconectar con tu cuerpo y tus sensaciones.',
      puedeAyudarCon: ['Resiliencia', 'Energía', 'Cuerpo'],
      tecnicas: ['Terapia somática'],
      whatsapp: '+34600000011'
    },
    {
      id: 17,
      titulo: 'Quiropraxia y ajuste postural',
      profesional: 'Carlos Martín',
      precio: 65,
      duracion: 45,
      imagen: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
      temas: ['Bienestar'],
      tipos: ['Quiropraxia'],
      modalidad: 'Presencial',
      descripcion: 'Sesión de quiropraxia y ajuste postural para mejorar tu bienestar físico y aliviar tensiones.',
      puedeAyudarCon: ['Bienestar', 'Dolor', 'Postura'],
      tecnicas: ['Quiropraxia'],
      whatsapp: '+34600000012'
    },
    {
      id: 18,
      titulo: 'Acupuntura para el estrés',
      profesional: 'Liu Wei',
      precio: 55,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800',
      temas: ['Concentración', 'Bienestar'],
      tipos: ['Acupuntura'],
      modalidad: 'Presencial',
      descripcion: 'Sesión de acupuntura enfocada en reducir el estrés y mejorar el bienestar general.',
      puedeAyudarCon: ['Concentración', 'Bienestar', 'Estrés'],
      tecnicas: ['Acupuntura'],
      whatsapp: '+34600000013'
    },
    {
      id: 19,
      titulo: 'Masaje terapéutico profundo',
      profesional: 'Elena Ruiz',
      precio: 70,
      duracion: 60,
      imagen: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800',
      temas: ['Bienestar', 'Energía'],
      tipos: ['Masaje'],
      modalidad: 'Presencial',
      descripcion: 'Masaje terapéutico de tejido profundo para liberar tensiones musculares y recuperar el bienestar físico.',
      puedeAyudarCon: ['Bienestar', 'Energía', 'Dolor'],
      tecnicas: ['Masaje terapéutico'],
      whatsapp: '+34600000014'
    },
    {
      id: 20,
      titulo: 'Yoga restaurativo y relajación',
      profesional: 'Sofía González',
      precio: 40,
      duracion: 75,
      imagen: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
      temas: ['Bienestar', 'Concentración'],
      tipos: ['Yoga'],
      modalidad: 'Online',
      descripcion: 'Práctica de yoga restaurativo para restaurar la energía y encontrar la calma interior.',
      puedeAyudarCon: ['Bienestar', 'Concentración', 'Relajación'],
      tecnicas: ['Yoga restaurativo'],
      whatsapp: '+34600000015'
    },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sesion = this.todasLasSesiones.find(s => s.id === id);
  }

  volver(): void {
    this.router.navigate(['/sesiones']);
  }

  seleccionarImagen(index: number): void {
    this.imagenActiva = index;
  }

  getImagenActiva(): string {
    if (!this.sesion) return '';
    if (this.sesion.imagenes && this.sesion.imagenes.length > 0) {
      return this.sesion.imagenes[this.imagenActiva];
    }
    return this.sesion.imagen;
  }

  tieneVariasImagenes(): boolean {
    return !!(this.sesion?.imagenes && this.sesion.imagenes.length > 1);
  }

  mostrarModal: boolean = false;

  abrirWhatsApp(): void {
    this.mostrarModal = true;
  }

  confirmarWhatsApp(): void {
    this.mostrarModal = false;
    if (this.sesion?.whatsapp) {
      window.open(`https://wa.me/${this.sesion.whatsapp.replace(/\D/g, '')}`, '_blank');
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  abrirInstagram(): void {
    if (this.sesion?.instagram) {
      window.open(`https://instagram.com/${this.sesion.instagram}`, '_blank');
    }
  }

  abrirWeb(): void {
    if (this.sesion?.web) {
      window.open(this.sesion.web, '_blank');
    }
  }

  enviarEmail(): void {
    if (this.sesion?.email) {
      window.open(`mailto:${this.sesion.email}`);
    }
  }

  llamar(): void {
    if (this.sesion?.telefono) {
      window.open(`tel:${this.sesion.telefono}`);
    }
  }

  abrirUbicacion(): void {
    if (this.sesion?.ubicacion) {
      window.open(this.sesion.ubicacion, '_blank');
    }
  }

  getDescripcionParrafos(): string[] {
    return this.sesion?.descripcion?.split('\n').filter(p => p.trim() !== '') ?? [];
  }
}