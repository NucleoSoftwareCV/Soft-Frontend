import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Sesion {
  id: number;
  titulo: string;
  profesional: string;
  precio: number;
  duracion: number;
  imagen: string;
  temas: string[];
  tipos: string[];
}

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sesiones.html',
  styleUrls: ['./sesiones.css']
})
export class SesionesComponent implements OnInit {

  busqueda: string = '';
  temaSeleccionado: string = 'Todos los temas';
  tipoSeleccionado: string = 'Todos los tipos';
  mostrarDropdownTemas: boolean = false;
  mostrarDropdownTipos: boolean = false;

  temas: string[] = ['Todos los temas', 'Autoestima', 'Motivación', 'Bienestar', 'Resiliencia', 'Concentración', 'Propósito', 'Energía'];
  tipos: string[] = ['Todos los tipos', 'Terapia', 'Acupuntura', 'Quiropraxia', 'Yoga', 'Psicoterapia', 'Respiración', 'Masaje'];

  todasLasSesiones: Sesion[] = [
    { id: 1, titulo: 'Asesoría porteo ergonómico', profesional: 'Sara Sevilla Mena', precio: 60, duracion: 60, imagen: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400', temas: ['Bienestar'], tipos: ['Terapia'] },
    { id: 2, titulo: 'Identifica la herida de infancia que está condicionando tus relaciones', profesional: 'Marta Soro Psicología', precio: 70, duracion: 60, imagen: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', temas: ['Autoestima', 'Resiliencia'], tipos: ['Psicoterapia'] },
    { id: 3, titulo: 'Baño de sonido para parejas · Sound Healing', profesional: 'Ram Peris', precio: 80, duracion: 120, imagen: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', temas: ['Energía', 'Bienestar'], tipos: ['Terapia'] },
    { id: 4, titulo: 'Constelación individual. Desbloquea lo que te impide avanzar.', profesional: 'Fanny Sánchez Armisén', precio: 100, duracion: 60, imagen: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', temas: ['Propósito', 'Autoestima'], tipos: ['Terapia'] },
    { id: 5, titulo: 'Café Aromático', profesional: 'Anett Oravecz', precio: 15, duracion: 60, imagen: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', temas: ['Bienestar'], tipos: ['Terapia'] },
    { id: 6, titulo: 'ÉTERUM FLOW EXPERIENCE', profesional: 'Xus Montaner Pelufo', precio: 50, duracion: 90, imagen: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', temas: ['Energía'], tipos: ['Yoga'] },
    { id: 7, titulo: 'DESCUBRE TU PIEL | Asesoría Personalizada con Cosmética Fresca', profesional: 'Raquel Romero Juárez', precio: 0, duracion: 60, imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400', temas: ['Bienestar'], tipos: ['Terapia'] },
    { id: 8, titulo: 'EMBARAZO | Acompañamiento emocional para atravesarlo sin que...', profesional: 'Ana Laura Vital', precio: 40, duracion: 90, imagen: 'https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=400', temas: ['Bienestar', 'Resiliencia'], tipos: ['Psicoterapia'] },
    { id: 9, titulo: 'Sesión breathwork individual · Respiración consciente 1:1', profesional: 'Ram Peris', precio: 50, duracion: 60, imagen: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=400', temas: ['Energía', 'Concentración'], tipos: ['Respiración'] },
    { id: 10, titulo: 'Baño de sonido individual · Sound Healing 1:1', profesional: 'Ram Peris', precio: 50, duracion: 60, imagen: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400', temas: ['Bienestar', 'Energía'], tipos: ['Terapia'] },
    { id: 11, titulo: 'Terapia Holística', profesional: 'Ana Laura Vital', precio: 35, duracion: 60, imagen: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400', temas: ['Bienestar'], tipos: ['Terapia'] },
    { id: 12, titulo: 'Tarot Terapéutico | Lecturas personalizadas.', profesional: 'Ana Laura Vital', precio: 30, duracion: 45, imagen: 'https://images.unsplash.com/photo-1551269901-5c40c8dd8fb1?w=400', temas: ['Propósito'], tipos: ['Terapia'] },
    { id: 13, titulo: 'Meditación sensible al trauma', profesional: 'Pausa, Salud', precio: 12, duracion: 30, imagen: 'https://images.unsplash.com/photo-1506126279646-a697353d3166?w=400', temas: ['Resiliencia', 'Bienestar'], tipos: ['Yoga'] },
    { id: 14, titulo: 'Sesiones de hipnosis clínica y la terapia cognitivo conductual.', profesional: 'Pausa, Salud', precio: 80, duracion: 60, imagen: 'https://images.unsplash.com/photo-1591343395902-1adcb454c4e2?w=400', temas: ['Concentración', 'Motivación'], tipos: ['Psicoterapia'] },
    { id: 15, titulo: 'Lectura Diseño Humano', profesional: 'Cristina Jiménez', precio: 150, duracion: 90, imagen: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=400', temas: ['Propósito', 'Autoestima'], tipos: ['Terapia'] },
    { id: 16, titulo: 'VUELVE A SENTIR, a través de una inmersión somática personalizada', profesional: 'Muriel Toutant', precio: 150, duracion: 120, imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', temas: ['Resiliencia', 'Energía'], tipos: ['Terapia'] },
    { id: 17, titulo: 'Quiropraxia y ajuste postural', profesional: 'Carlos Martín', precio: 65, duracion: 45, imagen: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400', temas: ['Bienestar'], tipos: ['Quiropraxia'] },
    { id: 18, titulo: 'Acupuntura para el estrés', profesional: 'Liu Wei', precio: 55, duracion: 60, imagen: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400', temas: ['Concentración', 'Bienestar'], tipos: ['Acupuntura'] },
    { id: 19, titulo: 'Masaje terapéutico profundo', profesional: 'Elena Ruiz', precio: 70, duracion: 60, imagen: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400', temas: ['Bienestar', 'Energía'], tipos: ['Masaje'] },
    { id: 20, titulo: 'Yoga restaurativo y relajación', profesional: 'Sofía González', precio: 40, duracion: 75, imagen: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400', temas: ['Bienestar', 'Concentración'], tipos: ['Yoga'] },
  ];

  sesionesVisibles: Sesion[] = [];
  sesionesFiltradas: Sesion[] = [];
  cantidad: number = 12;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.filtrar();
  }

  verDetalle(id: number): void {
    this.router.navigate(['/sesiones', id]);
  }

  filtrar(): void {
    this.sesionesFiltradas = this.todasLasSesiones.filter(s => {
      const coincideBusqueda = s.titulo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        s.profesional.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideTema = this.temaSeleccionado === 'Todos los temas' || s.temas.includes(this.temaSeleccionado);
      const coincideTipo = this.tipoSeleccionado === 'Todos los tipos' || s.tipos.includes(this.tipoSeleccionado);
      return coincideBusqueda && coincideTema && coincideTipo;
    });
    this.cantidad = 12;
    this.sesionesVisibles = this.sesionesFiltradas.slice(0, this.cantidad);
  }

  cargarMas(): void {
    this.cantidad += 12;
    this.sesionesVisibles = this.sesionesFiltradas.slice(0, this.cantidad);
  }

  seleccionarTema(tema: string): void {
    this.temaSeleccionado = tema;
    this.mostrarDropdownTemas = false;
    this.filtrar();
  }

  seleccionarTipo(tipo: string): void {
    this.tipoSeleccionado = tipo;
    this.mostrarDropdownTipos = false;
    this.filtrar();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.temaSeleccionado = 'Todos los temas';
    this.tipoSeleccionado = 'Todos los tipos';
    this.filtrar();
  }

  hayFiltrosActivos(): boolean {
    return this.busqueda !== '' || this.temaSeleccionado !== 'Todos los temas' || this.tipoSeleccionado !== 'Todos los tipos';
  }

  toggleTemas(): void {
    this.mostrarDropdownTemas = !this.mostrarDropdownTemas;
    this.mostrarDropdownTipos = false;
  }

  toggleTipos(): void {
    this.mostrarDropdownTipos = !this.mostrarDropdownTipos;
    this.mostrarDropdownTemas = false;
  }
}