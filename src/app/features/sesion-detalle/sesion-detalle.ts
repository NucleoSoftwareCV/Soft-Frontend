import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import { OneToOneServiceDetailResponse } from '../../shared/models/one-to-one-service.model';

@Component({
  selector: 'app-sesion-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sesion-detalle.html',
  styleUrls: ['./sesion-detalle.css']
})
export class SesionDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly oneToOneServices = inject(OneToOneServicesService);

  readonly sesion = signal<OneToOneServiceDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly fallbackImage = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=85';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSesion(id);
  }

  volver(): void {
    this.router.navigate(['/sesiones']);
  }

  formatPrice(): string {
    const current = this.sesion();
    if (!current || current.price === null || current.price === undefined || Number(current.price) === 0) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: current.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(Number(current.price));
  }

  durationLabel(): string {
    const duration = this.sesion()?.durationMinutes;
    return duration ? `${duration} min` : 'Duración por confirmar';
  }

  modalityLabel(): string {
    const modality = this.sesion()?.modality;
    const labels: Record<string, string> = {
      ONLINE: 'Online',
      PRESENCIAL: 'Presencial',
      AMBAS: 'Online y presencial',
    };
    return modality ? labels[modality] ?? modality : 'Modalidad por confirmar';
  }

  specialistInitial(): string {
    return this.sesion()?.specialistName?.trim().charAt(0).toUpperCase() || 'S';
  }

  getDescripcionParrafos(): string[] {
    return this.sesion()?.description?.split('\n').filter(p => p.trim() !== '') ?? [];
  }

  private loadSesion(id: number): void {
    if (!id) {
      this.error.set('Sesión no encontrada.');
      this.loading.set(false);
      return;
    }

    this.oneToOneServices.getPublicService(id).subscribe({
      next: response => {
        this.sesion.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar esta sesión.');
        this.loading.set(false);
      },
    });
  }
}
