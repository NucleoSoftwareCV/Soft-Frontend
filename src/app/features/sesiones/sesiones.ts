import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import { OneToOneServiceCardResponse } from '../../shared/models/one-to-one-service.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sesiones.html',
  styleUrls: ['./sesiones.css']
})
export class SesionesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly oneToOneServices = inject(OneToOneServicesService);

  readonly sesiones = signal<OneToOneServiceCardResponse[]>([]);
  readonly totalSesiones = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);

  readonly pageSize = 12;
  readonly skeletonCards = Array.from({ length: 8 });
  readonly fallbackImage = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&auto=format&fit=crop&q=85';
  private currentPage = 0;
  private totalPages = 0;

  ngOnInit(): void {
    this.loadSesiones(0);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/sesiones', id]);
  }

  cargarMas(): void {
    if (!this.hasMorePages() || this.loadingMore()) return;
    this.loadSesiones(this.currentPage + 1, true);
  }

  reintentar(): void {
    this.loadSesiones(0);
  }

  hasMorePages(): boolean {
    return this.currentPage + 1 < this.totalPages;
  }

  imageFor(sesion: OneToOneServiceCardResponse): string {
    return sesion.imageUrl || this.fallbackImage;
  }

  specialistInitial(sesion: OneToOneServiceCardResponse): string {
    return sesion.specialistName?.trim().charAt(0).toUpperCase() || 'S';
  }

  formatPrice(sesion: OneToOneServiceCardResponse): string {
    if (sesion.price === null || sesion.price === undefined || Number(sesion.price) === 0) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: sesion.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(Number(sesion.price));
  }

  durationLabel(sesion: OneToOneServiceCardResponse): string {
    return sesion.durationMinutes ? `${sesion.durationMinutes} min` : 'Duración por confirmar';
  }

  private loadSesiones(page: number, append = false): void {
    append ? this.loadingMore.set(true) : this.loading.set(true);
    this.error.set(null);

    this.oneToOneServices.getPublicServices({
      page,
      size: this.pageSize,
      sort: 'createdAt,desc',
    }).subscribe({
      next: response => {
        const content = response.content ?? [];
        this.sesiones.set(append ? [...this.sesiones(), ...content] : content);
        this.totalSesiones.set(response.totalElements ?? content.length);
        this.currentPage = response.number ?? page;
        this.totalPages = response.totalPages ?? 0;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        if (!append) {
          this.sesiones.set([]);
          this.totalSesiones.set(0);
        }
        this.error.set('El backend no está disponible en este momento. No se pueden mostrar sesiones reales.');
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
