import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import { ProfessionalFollowService } from '../../services/professional-follow.service';
import { OneToOneServiceDetailResponse } from '../../shared/models/one-to-one-service.model';
import { AuthService } from '../../core/services/auth.service';
import {
  LucideArrowLeft,
  LucideClock3,
  LucideMapPin,
  LucideMessageCircle,
  LucideMonitor,
} from '@lucide/angular';

@Component({
  selector: 'app-sesion-detalle',
  standalone: true,
  imports: [CommonModule, LucideArrowLeft, LucideClock3, LucideMapPin, LucideMessageCircle, LucideMonitor],
  templateUrl: './sesion-detalle.html',
  styleUrls: ['./sesion-detalle.css']
})
export class SesionDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly oneToOneServices = inject(OneToOneServicesService);
  private readonly followService = inject(ProfessionalFollowService);
  private readonly authService = inject(AuthService);

  readonly sesion = signal<OneToOneServiceDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly following = signal(false);
  readonly followLoading = signal(false);
  readonly followError = signal<string | null>(null);
  readonly fallbackImage = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=85';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSesion(id);
  }

  volver(): void {
    this.router.navigate(['/sesiones']);
  }

  toggleFollow(): void {
    const professionalId = this.sesion()?.specialistId;
    if (!professionalId || this.followLoading()) return;

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.followLoading.set(true);
    this.followError.set(null);
    const request = this.following()
      ? this.followService.unfollow(professionalId)
      : this.followService.follow(professionalId);

    request.subscribe({
      next: response => {
        this.following.set(response.following);
        this.followLoading.set(false);
      },
      error: () => {
        this.followError.set('No pudimos actualizar el seguimiento. Intentalo de nuevo.');
        this.followLoading.set(false);
      },
    });
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

  sessionImage(): string {
    return this.oneToOneServices.resolveAssetUrl(this.sesion()?.imageUrl) || this.fallbackImage;
  }

  specialistPhoto(): string | null {
    return this.oneToOneServices.resolveAssetUrl(this.sesion()?.specialistPhotoUrl);
  }

  whatsappUrl(): string | null {
    const phone = this.sesion()?.specialistWhatsappPhone?.replace(/\D/g, '');
    if (!phone) return null;
    const title = this.sesion()?.title ?? 'tu sesion 1:1';
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, me interesa la sesion: ${title}`)}`;
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
        this.loadFollowStatus(response.specialistId);
      },
      error: () => {
        this.error.set('No pudimos cargar esta sesión.');
        this.loading.set(false);
      },
    });
  }

  private loadFollowStatus(professionalId: number): void {
    if (!professionalId || !this.authService.isLoggedIn) return;

    this.followService.getStatus(professionalId).subscribe({
      next: response => this.following.set(response.following),
      error: () => this.following.set(false),
    });
  }
}
