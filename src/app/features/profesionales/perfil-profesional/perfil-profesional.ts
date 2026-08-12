import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SpecialistProfileService, SpecialistProfileResponse} from '../../../services/profesionales.service';

import { TarjetaDirectorio } from '../../../shared/models/tarjeta-directorio.model';
import { toTarjetaDirectorio } from '../../../shared/utils/tarjeta-directorio.util';
import { AppIcon, IconName } from '../../../shared/components/icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';

import { EventosService } from '../../../services/eventos.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';

import { EventCardResponse } from '../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../shared/models/one-to-one-service.model';
import { EventoCardComponent } from '../../../shared/components/evento-card/evento-card.component';
import { SesionCardComponent } from '../../../shared/components/sesion-card/sesion-card.component';
import { EventoCalendarComponent } from '../../../shared/components/evento-calendar/evento-calendar.component';

@Component({
  selector: 'app-perfil-profesional',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AppIcon,
    EventoCardComponent,
    SesionCardComponent,
    EventoCalendarComponent,
  ],
  templateUrl: './perfil-profesional.html',
  styleUrl: './perfil-profesional.css'
})
export class PerfilProfesional implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly specialistProfileService =
    inject(SpecialistProfileService);

  private readonly authService = inject(AuthService);
  private readonly followService = inject(ProfessionalFollowService);
  private readonly eventosService = inject(EventosService);
  private readonly oneToOneServicesService = inject(OneToOneServicesService);

  readonly perfil = signal<TarjetaDirectorio | null>(null);
  readonly following = signal(false);
  readonly followLoading = signal(false);
  readonly followError = signal<string | null>(null);
  readonly publicPhotoFailed = signal(false);
  readonly isOwnProfile = computed(() => {
    const currentProfile = this.perfil();
    const currentUser = this.authService.currentUser();
    return Boolean(currentProfile && currentUser && currentProfile.userId === currentUser.id);
  });

  readonly eventos = signal<EventCardResponse[]>([]);
  readonly sesiones = signal<OneToOneServiceCardResponse[]>([]);
  readonly galleryLightboxIndex = signal<number | null>(null);

  readonly mostrarEventos = computed(() =>
    Boolean(this.perfil()?.showUpcomingEvents) && this.eventos().length > 0
  );

  readonly mostrarSesiones = computed(() =>
    Boolean(this.perfil()?.showOneToOneSessions) && this.sesiones().length > 0
  );

  readonly mostrarGaleria = computed(() =>
    Boolean(this.perfil()?.showGallery) && (this.perfil()?.galleryImages?.length ?? 0) > 0
  );

  ngOnInit(): void {

    const slug =
      this.route.snapshot.paramMap.get('slug');

    if (!slug) {

      this.router.navigate(['/profesionales']);
      return;

    }

    this.cargarPerfil(slug);

  }

  cargarPerfil(slug: string): void {

    this.publicPhotoFailed.set(false);

    this.specialistProfileService
      .getPublicProfileBySlug(slug)
      .subscribe({

        next: (perfilBackend) => {

          this.perfil.set(
            this.convertirPerfil(perfilBackend)
          );
          if (this.authService.isLoggedIn && perfilBackend.userId !== this.authService.currentUser()?.id) {
            this.loadFollowStatus(perfilBackend.id);
          }

          this.cargarEventos(
            perfilBackend.id
          );

          this.cargarSesiones(
            perfilBackend.id
          );
        },

        error: (error) => {
          console.error(
            'Error al cargar el perfil:',
            error
          );

          this.router.navigate([
            '/profesionales'
          ]);
        }
      });
  }

  handlePublicPhotoError(): void {
    this.publicPhotoFailed.set(true);
  }

  whatsappLink(phone?: string): string {
    return `https://wa.me/${(phone ?? '').replace(/\D/g, '')}`;
  }

  instagramLink(): string | undefined {
    return this.perfil()
      ?.socialLinks
      ?.find(link => link.platform?.toUpperCase() === 'INSTAGRAM')
      ?.profileUrl;
  }

  cargarEventos(
    specialistId: number
  ): void {

    this.eventosService
      .getEventosPorEspecialista(
        specialistId
      )
      .subscribe({

        next: (response) => {
          this.eventos.set(response.content);
        },

        error: (error) => {
          console.error(
            'Error al cargar eventos:',
            error
          );
        }
      });
  }

  cargarSesiones(
    specialistId: number
  ): void {

    this.oneToOneServicesService
      .getServicesBySpecialist(specialistId)
      .subscribe({

        next: (response) => {
          this.sesiones.set(response.content);
        },

        error: (error) => {
          console.error(
            'Error al cargar sesiones:',
            error
          );
        }
      });
  }

  openGalleryLightbox(index: number): void {
    this.galleryLightboxIndex.set(index);
  }

  closeGalleryLightbox(): void {
    this.galleryLightboxIndex.set(null);
  }

  nextGalleryImage(): void {
    const total = this.perfil()?.galleryImages?.length ?? 0;
    if (!total) return;
    this.galleryLightboxIndex.update(current => ((current ?? 0) + 1) % total);
  }

  previousGalleryImage(): void {
    const total = this.perfil()?.galleryImages?.length ?? 0;
    if (!total) return;
    this.galleryLightboxIndex.update(current => ((current ?? 0) - 1 + total) % total);
  }

  private convertirPerfil(
    perfil: SpecialistProfileResponse
  ): TarjetaDirectorio {

    return toTarjetaDirectorio(
      perfil,
      url => this.specialistProfileService.resolveAssetUrl(url)
    );
  }

  volverAlDirectorio(): void {

    this.router.navigate([
      '/profesionales'
    ]);

  }

  toggleFollow(): void {
    const currentProfile = this.perfil();
    if (!currentProfile || this.isOwnProfile() || this.followLoading()) return;

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.followLoading.set(true);
    this.followError.set(null);
    const request = this.following()
      ? this.followService.unfollow(currentProfile.id)
      : this.followService.follow(currentProfile.id);

    request.subscribe({
      next: response => {
        this.following.set(response.following);
        this.followLoading.set(false);
      },
      error: () => {
        this.followError.set('No pudimos actualizar el seguimiento. Inténtalo nuevamente.');
        this.followLoading.set(false);
      }
    });
  }

  private loadFollowStatus(professionalId: number): void {
    this.followService.getStatus(professionalId).subscribe({
      next: response => this.following.set(response.following),
      error: () => this.following.set(false)
    });
  }

}
