import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SpecialistProfileService, SpecialistProfileResponse} from '../../../services/profesionales.service';

import { TarjetaDirectorio } from '../directorio/directorio';
import { AppIcon, IconName } from '../../../shared/components/icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';

import { EventosService } from '../../../services/eventos.service';

import { EventCardResponse } from '../../../shared/models/evento.model';

@Component({
  selector: 'app-perfil-profesional',
  standalone: true,
  imports: [
    CommonModule,
    AppIcon
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

  readonly perfil = signal<TarjetaDirectorio | null>(null);
  readonly following = signal(false);
  readonly followLoading = signal(false);
  readonly followError = signal<string | null>(null);
  readonly isOwnProfile = computed(() => {
    const currentProfile = this.perfil();
    const currentUser = this.authService.currentUser();
    return Boolean(currentProfile && currentUser && currentProfile.userId === currentUser.id);
  });

  eventos: EventCardResponse[] = [];

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

  cargarEventos(
    organizerId: number
  ): void {

    this.eventosService
      .getEventosPorOrganizador(
        organizerId
      )
      .subscribe({

        next: (response) => {
          this.eventos =
            response.content;

          console.log(
            'Eventos cargados:',
            this.eventos
          );
        },

        error: (error) => {
          console.error(
            'Error al cargar eventos:',
            error
          );
        }
      });
  }

  private convertirPerfil(
    perfil: SpecialistProfileResponse
  ): TarjetaDirectorio {

    const temas =
      perfil.workTopics ?? [];

    const tecnicas =
      perfil.techniques ?? [];

    return {

      id: perfil.id,
      userId: perfil.userId,

      tipo: this.convertirTipo(
        perfil.profileCategory
      ),

      nombre: perfil.publicName,

      ubicacion: 'Valencia',

      ubicacionCompleta:
        'Valencia, España',

      cita:
        perfil.biography,

      bio:
        perfil.biography,

      tags: [
        ...temas,
        ...tecnicas
      ],

      imagenUrl:
        this.specialistProfileService.resolveAssetUrl(perfil.photoUrl),

      bannerUrl:
        this.specialistProfileService.resolveAssetUrl(perfil.bannerUrl),

      temas,

      tecnicas,

      slug:
        perfil.slug,

      whatsappPhone:
        perfil.whatsappPhone,

      phoneNumber:
        perfil.phoneNumber,

      publicEmail:
        perfil.publicEmail,

      website:
        perfil.website,

      socialLinks:
        perfil.socialLinks,

      isLogoStyle:
        false

    };

  }

  private convertirTipo(
    categoria: string
  ):
    | 'Profesional'
    | 'Centro'
    | 'Organizador de eventos' {

    switch (categoria?.toUpperCase()) {

      case 'CENTRO':
      case 'CENTROS':
        return 'Centro';

      case 'ORGANIZADOR':
      case 'ORGANIZADORES':
      case 'ORGANIZADOR_DE_EVENTOS':
      case 'ORGANIZADORES_DE_EVENTOS':
        return 'Organizador de eventos';

      default:
        return 'Profesional';

    }

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
