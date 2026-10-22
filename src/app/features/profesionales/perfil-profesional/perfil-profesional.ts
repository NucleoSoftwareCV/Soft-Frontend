
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  SpecialistProfileService,
  SpecialistProfileResponse,
  ProfessionalReviewResponse,
  ProfessionalReviewSummaryResponse
} from '../../../services/profesionales.service';

import { TarjetaDirectorio } from '../../../shared/models/tarjeta-directorio.model';
import { toTarjetaDirectorio } from '../../../shared/utils/tarjeta-directorio.util';
import { AppIcon } from '../../../shared/components/icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';

import { EventosService } from '../../../services/eventos.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';

import { EventCardResponse } from '../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../shared/models/one-to-one-service.model';
import { EventoCardComponent } from '../../../shared/components/evento-card/evento-card.component';
import { SesionCardComponent } from '../../../shared/components/sesion-card/sesion-card.component';
import { EventoCalendarComponent } from '../../../shared/components/evento-calendar/evento-calendar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

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
    ConfirmDialogComponent,
  ],
  templateUrl: './perfil-profesional.html',
  styleUrl: './perfil-profesional.css'
})
export class PerfilProfesional implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly specialistProfileService =
    inject(SpecialistProfileService);

  private readonly authService = inject(AuthService);
  private readonly followService = inject(ProfessionalFollowService);
  private readonly eventosService = inject(EventosService);
  private readonly oneToOneServicesService =
    inject(OneToOneServicesService);

  readonly perfil = signal<TarjetaDirectorio | null>(null);
  readonly following = signal(false);
  readonly followLoading = signal(false);
  readonly followError = signal<string | null>(null);
  readonly showUnfollowDialog = signal(false);
  readonly publicPhotoFailed = signal(false);

  readonly isOwnProfile = computed(() => {
    const currentProfile = this.perfil();
    const currentUser = this.authService.currentUser();

    return Boolean(
      currentProfile &&
      currentUser &&
      currentProfile.userId === currentUser.id
    );
  });

  readonly eventos = signal<EventCardResponse[]>([]);
  readonly sesiones = signal<OneToOneServiceCardResponse[]>([]);
  readonly galleryLightboxIndex = signal<number | null>(null);

  readonly mostrarEventos = computed(() =>
    Boolean(this.perfil()?.showUpcomingEvents) &&
    this.eventos().length > 0
  );

  readonly mostrarSesiones = computed(() =>
    Boolean(this.perfil()?.showOneToOneSessions) &&
    this.sesiones().length > 0
  );

  readonly mostrarGaleria = computed(() =>
    Boolean(this.perfil()?.showGallery) &&
    (this.perfil()?.galleryImages?.length ?? 0) > 0
  );

  readonly showShareDialog = signal(false);
  readonly shareUrl = signal('');
  readonly copied = signal(false);

  // Comentarios del perfil profesional.
  readonly comentarios = signal<ProfessionalReviewResponse[]>([]);
  readonly totalComentarios = signal(0);
  readonly paginaComentarios = signal(0);
  readonly hayMasComentarios = signal(false);
  readonly cargandoComentarios = signal(false);
  readonly publicandoComentario = signal(false);
  readonly comentarioTexto = signal('');
  readonly errorComentarios = signal<string | null>(null);
  readonly mensajeComentario = signal<string | null>(null);

  readonly estaAutenticado = computed(() =>
    this.authService.isLoggedIn
  );

  readonly urlRetorno = computed(() => this.router.url);

  openShareDialog(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) return;

    this.shareUrl.set(
      `${window.location.origin}/profesionales/${slug}`
    );

    this.copied.set(false);
    this.showShareDialog.set(true);
  }

  closeShareDialog(): void {
    this.showShareDialog.set(false);
  }

  async copyShareUrl(): Promise<void> {
    const url = this.shareUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');

      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';

      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  shareTargets(): { name: string; url: string }[] {
    const url = encodeURIComponent(this.shareUrl());
    const nombre = this.perfil()?.nombre ?? 'este profesional';
    const text = encodeURIComponent(
      `Mira el perfil de ${nombre} en Oona`
    );

    return [
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${url}`
      },
      {
        name: 'Messenger',
        url: `https://www.facebook.com/dialog/send?link=${url}&app_id=TU_FB_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`
      },
      {
        name: 'X',
        url: `https://twitter.com/intent/tweet?url=${url}&text=${text}`
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/?text=${text}%20${url}`
      },
      {
        name: 'Email',
        url: `mailto:?subject=${text}&body=${url}`
      }
    ];
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.router.navigate(['/profesionales']);
      return;
    }

    this.cargarPerfil(slug);
    this.cargarComentarios(slug);
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

          if (
            this.authService.isLoggedIn &&
            perfilBackend.userId !== this.authService.currentUser()?.id
          ) {
            this.loadFollowStatus(perfilBackend.id);
          }

          this.cargarEventos(perfilBackend.id);
          this.cargarSesiones(perfilBackend.id);
        },

        error: (error) => {
          console.error('Error al cargar el perfil:', error);
          this.router.navigate(['/profesionales']);
        }
      });
  }

  // Carga los comentarios de un perfil.
  cargarComentarios(slug: string, cargarMas = false): void {
    if (this.cargandoComentarios()) return;

    this.cargandoComentarios.set(true);
    this.errorComentarios.set(null);
    this.mensajeComentario.set(null);

    const pagina = cargarMas
      ? this.paginaComentarios() + 1
      : 0;

    this.specialistProfileService
      .getProfessionalReviews(slug, pagina, 10)
      .subscribe({
        next: (response: ProfessionalReviewSummaryResponse) => {
          this.comentarios.update(actuales =>
            cargarMas
              ? [...actuales, ...response.reviews]
              : response.reviews
          );

          this.totalComentarios.set(response.total);
          this.paginaComentarios.set(response.page);
          this.hayMasComentarios.set(response.hasMore);
          this.cargandoComentarios.set(false);
        },

        error: (error) => {
          console.error('Error al cargar comentarios:', error);
          this.errorComentarios.set(
            'No se pudieron cargar los comentarios. Inténtalo nuevamente.'
          );
          this.cargandoComentarios.set(false);
        }
      });
  }

  // Publica un comentario textual.
  publicarComentario(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    const comment = this.comentarioTexto().trim();

    if (!slug || !comment || this.publicandoComentario()) {
      return;
    }

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.publicandoComentario.set(true);
    this.errorComentarios.set(null);
    this.mensajeComentario.set(null);

    this.specialistProfileService
      .createProfessionalReview(slug, comment)
      .subscribe({
        next: () => {
          this.comentarioTexto.set('');
          this.publicandoComentario.set(false);
          this.mensajeComentario.set(
            'Tu comentario se publicó correctamente.'
          );

          // Actualiza la lista para mostrar el comentario recién publicado.
          this.cargarComentarios(slug);
        },

        error: (error) => {
          console.error('Error al publicar el comentario:', error);

          this.publicandoComentario.set(false);
          this.errorComentarios.set(
            error?.error?.message ??
            'No se pudo publicar el comentario. Verifica que hayas iniciado sesión e inténtalo nuevamente.'
          );
        }
      });
  }

  actualizarTextoComentario(texto: string): void {
    this.comentarioTexto.set(texto);
    this.errorComentarios.set(null);
    this.mensajeComentario.set(null);
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
      ?.find(link =>
        link.platform?.toUpperCase() === 'INSTAGRAM'
      )
      ?.profileUrl;
  }

  cargarEventos(specialistId: number): void {
    this.eventosService
      .getEventosPorEspecialista(specialistId)
      .subscribe({
        next: (response) => {
          this.eventos.set(response.content);
        },

        error: (error) => {
          console.error('Error al cargar eventos:', error);
        }
      });
  }

  cargarSesiones(specialistId: number): void {
    this.oneToOneServicesService
      .getServicesBySpecialist(specialistId)
      .subscribe({
        next: (response) => {
          this.sesiones.set(response.content);
        },

        error: (error) => {
          console.error('Error al cargar sesiones:', error);
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

    this.galleryLightboxIndex.update(current =>
      ((current ?? 0) + 1) % total
    );
  }

  previousGalleryImage(): void {
    const total = this.perfil()?.galleryImages?.length ?? 0;

    if (!total) return;

    this.galleryLightboxIndex.update(current =>
      ((current ?? 0) - 1 + total) % total
    );
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
    this.router.navigate(['/profesionales']);
  }

  toggleFollow(): void {
    const currentProfile = this.perfil();

    if (
      !currentProfile ||
      this.isOwnProfile() ||
      this.followLoading()
    ) {
      return;
    }

    if (!this.authService.isLoggedIn) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (this.following()) {
      this.showUnfollowDialog.set(true);
      return;
    }

    this.updateFollow(true);
  }

  confirmUnfollow(): void {
    this.updateFollow(false);
  }

  cancelUnfollow(): void {
    if (!this.followLoading()) {
      this.showUnfollowDialog.set(false);
    }
  }

  private updateFollow(shouldFollow: boolean): void {
    const currentProfile = this.perfil();

    if (!currentProfile || this.followLoading()) return;

    this.followLoading.set(true);
    this.followError.set(null);

    const request = shouldFollow
      ? this.followService.follow(currentProfile.id)
      : this.followService.unfollow(currentProfile.id);

    request.subscribe({
      next: response => {
        this.following.set(response.following);
        this.followLoading.set(false);
        this.showUnfollowDialog.set(false);
      },

      error: () => {
        this.followError.set(
          'No pudimos actualizar el seguimiento. Inténtalo nuevamente.'
        );
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
