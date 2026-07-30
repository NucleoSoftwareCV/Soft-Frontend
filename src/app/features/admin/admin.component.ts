import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import {
  ProfessionalApplicationResponse,
  ProfessionalApplicationStatus,
} from '../../shared/models/professional-application.model';

type AdminSection = 'dashboard' | 'profesionales' | 'eventos' | 'usuarios' | 'config';

interface ProfesionalItem {
  id: number;
  nombre: string;
  email: string;
  disciplina: string;
  ciudad: string;
  experiencias: number;
  asistentesTotales: number;
  ingresos: number;
  fechaRegistro: string;
  estado: 'activo' | 'pendiente' | 'suspendido';
  avatar: string;
}

interface EventoItem {
  id: number;
  titulo: string;
  profesional: string;
  fecha: string;
  precio: number;
  plazas: number;
  plazasOcupadas: number;
  ingresos: number;
  estado: 'activo' | 'pausado' | 'cancelado';
}

interface UsuarioItem {
  id: number;
  nombre: string;
  email: string;
  tipo: 'usuario' | 'profesional';
  fechaRegistro: string;
  ultimoAcceso: string;
  reservas: number;
  estado: 'activo' | 'inactivo' | 'suspendido';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  private readonly applicationService = inject(ProfessionalApplicationService);

  seccion = signal<AdminSection>('dashboard');
  profesionales = signal<ProfesionalItem[]>([]);
  eventos = signal<EventoItem[]>([]);
  usuarios = signal<UsuarioItem[]>([]);
  solicitudes = signal<ProfessionalApplicationResponse[]>([]);
  solicitudesLoading = signal(false);
  solicitudesError = signal<string | null>(null);
  solicitudesPage = signal(0);
  solicitudesTotalPages = signal(0);
  solicitudesStatus = signal<ProfessionalApplicationStatus | null>('PENDIENTE');
  rejectingId = signal<number | null>(null);
  rejectionReason = '';

  constructor() {
    this.cargarDatosDemo();
  }

  private cargarDatosDemo(): void {
    this.profesionales.set([
      { id: 1, nombre: 'María García López', email: 'maria.garcia@email.com', disciplina: 'Yoga & Meditación', ciudad: 'Valencia', experiencias: 8, asistentesTotales: 142, ingresos: 8400, fechaRegistro: '2025-11-15', estado: 'activo', avatar: 'https://i.pravatar.cc/40?img=1' },
      { id: 2, nombre: 'Carlos Ruiz Molina', email: 'carlos.ruiz@email.com', disciplina: 'Breathwork & Sonido', ciudad: 'Barcelona', experiencias: 5, asistentesTotales: 89, ingresos: 5200, fechaRegistro: '2026-01-20', estado: 'activo', avatar: 'https://i.pravatar.cc/40?img=3' },
      { id: 3, nombre: 'Ana Belén Martínez', email: 'ana.martinez@email.com', disciplina: 'Constelaciones Familiares', ciudad: 'Madrid', experiencias: 12, asistentesTotales: 67, ingresos: 12400, fechaRegistro: '2025-09-03', estado: 'activo', avatar: 'https://i.pravatar.cc/40?img=5' },
      { id: 4, nombre: 'Laura Sánchez Pérez', email: 'laura.sanchez@email.com', disciplina: 'Nutrición & Cocina', ciudad: 'Castellón', experiencias: 3, asistentesTotales: 34, ingresos: 2100, fechaRegistro: '2026-03-10', estado: 'pendiente', avatar: 'https://i.pravatar.cc/40?img=9' },
      { id: 5, nombre: 'Javier Fernández Soto', email: 'javier.fernandez@email.com', disciplina: 'Psicoterapia', ciudad: 'Alicante', experiencias: 6, asistentesTotales: 51, ingresos: 7200, fechaRegistro: '2025-12-01', estado: 'activo', avatar: 'https://i.pravatar.cc/40?img=11' },
      { id: 6, nombre: 'Sofía Hernández Crespo', email: 'sofia.hernandez@email.com', disciplina: 'Arte & Creatividad', ciudad: 'Valencia', experiencias: 4, asistentesTotales: 28, ingresos: 1800, fechaRegistro: '2026-05-22', estado: 'pendiente', avatar: 'https://i.pravatar.cc/40?img=13' },
      { id: 7, nombre: 'Diego Romero Navarro', email: 'diego.romero@email.com', disciplina: 'Yoga & Movimiento', ciudad: 'Barcelona', experiencias: 9, asistentesTotales: 115, ingresos: 6800, fechaRegistro: '2025-08-14', estado: 'activo', avatar: 'https://i.pravatar.cc/40?img=15' },
      { id: 8, nombre: 'Elena Torres Aguilar', email: 'elena.torres@email.com', disciplina: 'Masaje & Terapia Corporal', ciudad: 'Madrid', experiencias: 2, asistentesTotales: 12, ingresos: 2400, fechaRegistro: '2026-06-01', estado: 'suspendido', avatar: 'https://i.pravatar.cc/40?img=17' },
    ]);

    this.eventos.set([
      { id: 1, titulo: 'Retiro de Yoga y Meditación', profesional: 'María García López', fecha: '2026-07-15', precio: 250, plazas: 20, plazasOcupadas: 14, ingresos: 3500, estado: 'activo' },
      { id: 2, titulo: 'Taller de Breathwork', profesional: 'Carlos Ruiz Molina', fecha: '2026-07-22', precio: 25, plazas: 15, plazasOcupadas: 9, ingresos: 225, estado: 'activo' },
      { id: 3, titulo: 'Círculo de Mujeres Luna Llena', profesional: 'María García López', fecha: '2026-07-28', precio: 15, plazas: 30, plazasOcupadas: 22, ingresos: 330, estado: 'activo' },
      { id: 4, titulo: 'Masterclass de Cocina Nutritiva', profesional: 'Laura Sánchez Pérez', fecha: '2026-08-05', precio: 35, plazas: 12, plazasOcupadas: 7, ingresos: 245, estado: 'activo' },
      { id: 5, titulo: 'Yoga para Embarazadas', profesional: 'María García López', fecha: '2026-07-12', precio: 0, plazas: 10, plazasOcupadas: 8, ingresos: 0, estado: 'pausado' },
      { id: 6, titulo: 'Jornada Puertas Abiertas OONA', profesional: 'Administrador', fecha: '2026-08-01', precio: 0, plazas: 50, plazasOcupadas: 8, ingresos: 0, estado: 'cancelado' },
      { id: 7, titulo: 'Constelación Familiar Avanzada', profesional: 'Ana Belén Martínez', fecha: '2026-07-30', precio: 150, plazas: 1, plazasOcupadas: 1, ingresos: 150, estado: 'activo' },
      { id: 8, titulo: 'Sesión de Terapia de Sonido', profesional: 'Carlos Ruiz Molina', fecha: '2026-07-17', precio: 65, plazas: 1, plazasOcupadas: 1, ingresos: 65, estado: 'activo' },
    ]);

    this.usuarios.set([
      { id: 1, nombre: 'Marta García López', email: 'marta.garcia@email.com', tipo: 'profesional', fechaRegistro: '2025-11-15', ultimoAcceso: '2026-07-10', reservas: 12, estado: 'activo' },
      { id: 2, nombre: 'Carlos Ruiz Molina', email: 'carlos.ruiz@email.com', tipo: 'profesional', fechaRegistro: '2026-01-20', ultimoAcceso: '2026-07-09', reservas: 8, estado: 'activo' },
      { id: 3, nombre: 'Pablo Morales Vega', email: 'pablo.morales@email.com', tipo: 'usuario', fechaRegistro: '2026-06-10', ultimoAcceso: '2026-07-08', reservas: 3, estado: 'activo' },
      { id: 4, nombre: 'Laura Sánchez Pérez', email: 'laura.sanchez@email.com', tipo: 'profesional', fechaRegistro: '2026-03-10', ultimoAcceso: '2026-07-05', reservas: 2, estado: 'activo' },
      { id: 5, nombre: 'Carmen Ortega Díaz', email: 'carmen.ortega@email.com', tipo: 'usuario', fechaRegistro: '2026-06-20', ultimoAcceso: '2026-07-10', reservas: 5, estado: 'activo' },
      { id: 6, nombre: 'Sergio Delgado Pastor', email: 'sergio.delgado@email.com', tipo: 'usuario', fechaRegistro: '2026-07-01', ultimoAcceso: '2026-07-07', reservas: 1, estado: 'activo' },
      { id: 7, nombre: 'Elena Torres Aguilar', email: 'elena.torres@email.com', tipo: 'profesional', fechaRegistro: '2026-06-01', ultimoAcceso: '2026-07-03', reservas: 1, estado: 'suspendido' },
      { id: 8, nombre: 'Raúl Castro Medina', email: 'raul.castro@email.com', tipo: 'usuario', fechaRegistro: '2026-06-15', ultimoAcceso: '2026-07-09', reservas: 2, estado: 'activo' },
      { id: 9, nombre: 'Isabel Romero Pascual', email: 'isabel.romero@email.com', tipo: 'usuario', fechaRegistro: '2026-06-25', ultimoAcceso: '2026-07-10', reservas: 4, estado: 'activo' },
      { id: 10, nombre: 'Sofía Hernández Crespo', email: 'sofia.hernandez@email.com', tipo: 'profesional', fechaRegistro: '2026-05-22', ultimoAcceso: '2026-07-06', reservas: 2, estado: 'activo' },
      { id: 11, nombre: 'Alberto Jiménez Ruiz', email: 'alberto.jimenez@email.com', tipo: 'usuario', fechaRegistro: '2026-07-02', ultimoAcceso: '2026-07-08', reservas: 1, estado: 'activo' },
      { id: 12, nombre: 'Diego Romero Navarro', email: 'diego.romero@email.com', tipo: 'profesional', fechaRegistro: '2025-08-14', ultimoAcceso: '2026-07-10', reservas: 15, estado: 'activo' },
    ]);
  }

  cambiarSeccion(s: AdminSection): void {
    this.seccion.set(s);
    if (s === 'profesionales') this.cargarSolicitudes(0);
  }

  cargarSolicitudes(page = this.solicitudesPage()): void {
    this.solicitudesLoading.set(true);
    this.solicitudesError.set(null);
    this.applicationService.getForAdmin(this.solicitudesStatus(), page, 10).subscribe({
      next: response => {
        this.solicitudes.set(response.content);
        this.solicitudesPage.set(response.number);
        this.solicitudesTotalPages.set(response.totalPages);
        this.solicitudesLoading.set(false);
      },
      error: () => {
        this.solicitudesError.set('No se pudieron cargar las solicitudes.');
        this.solicitudesLoading.set(false);
      },
    });
  }

  filtrarSolicitudes(status: ProfessionalApplicationStatus | null): void {
    this.solicitudesStatus.set(status);
    this.cargarSolicitudes(0);
  }

  aprobarSolicitud(id: number): void {
    this.applicationService.decide(id, { status: 'APROBADO' }).subscribe({
      next: () => this.cargarSolicitudes(),
      error: () => this.solicitudesError.set('No se pudo aprobar la solicitud.'),
    });
  }

  iniciarRechazo(id: number): void {
    this.rejectingId.set(id);
    this.rejectionReason = '';
  }

  cancelarRechazo(): void {
    this.rejectingId.set(null);
    this.rejectionReason = '';
  }

  confirmarRechazo(id: number): void {
    const rejectionReason = this.rejectionReason.trim();
    if (!rejectionReason) {
      this.solicitudesError.set('Indica el motivo del rechazo.');
      return;
    }

    this.applicationService
      .decide(id, { status: 'RECHAZADO', rejectionReason })
      .subscribe({
        next: () => {
          this.cancelarRechazo();
          this.cargarSolicitudes();
        },
        error: () => this.solicitudesError.set('No se pudo rechazar la solicitud.'),
      });
  }

  // ── Dashboard computed ──
  totalProfesionales = computed(() => this.profesionales().length);
  totalActivos = computed(() => this.profesionales().filter(p => p.estado === 'activo').length);
  totalPendientes = computed(() => this.profesionales().filter(p => p.estado === 'pendiente').length);
  totalEventos = computed(() => this.eventos().length);
  totalUsuarios = computed(() => this.usuarios().length);
  ingresosTotales = computed(() => this.eventos().reduce((s, e) => s + e.ingresos, 0));
  asistentesTotales = computed(() => this.eventos().reduce((s, e) => s + e.plazasOcupadas, 0));

  profesionalesRecientes = computed(() =>
    [...this.profesionales()].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()).slice(0, 5)
  );

  eventosProximos = computed(() =>
    [...this.eventos()].filter(e => e.estado === 'activo').sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  );

  topProfesionales = computed(() =>
    [...this.profesionales()].sort((a, b) => b.ingresos - a.ingresos).slice(0, 5)
  );

  // ── Acciones ──
  aprobarProfesional(id: number): void {
    this.profesionales.update(arr => arr.map(p => p.id === id ? { ...p, estado: 'activo' as const } : p));
  }

  suspenderProfesional(id: number): void {
    this.profesionales.update(arr => arr.map(p => p.id === id ? { ...p, estado: 'suspendido' as const } : p));
  }

  cambiarEstadoEvento(id: number, estado: 'activo' | 'pausado' | 'cancelado'): void {
    this.eventos.update(arr => arr.map(e => e.id === id ? { ...e, estado } : e));
  }

  toggleUsuarioEstado(id: number): void {
    this.usuarios.update(arr => arr.map(u => {
      if (u.id !== id) return u;
      const next: UsuarioItem['estado'] = u.estado === 'activo' ? 'inactivo' : 'activo';
      return { ...u, estado: next };
    }));
  }
}
