import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SpecialistProfileService, SpecialistProfileResponse} from '../../../services/profesionales.service';
import { AppIcon, IconName } from '../../../shared/components/icon/icon';

export interface TarjetaDirectorio {

  id: number;
  userId: number;

  tipo:
    | 'Profesional'
    | 'Centro'
    | 'Organizador de eventos';

  nombre: string;

  ubicacion: string;
  ubicacionCompleta?: string;

  cita: string;
  bio?: string;

  tags: string[];

  imagenUrl?: string;
  bannerUrl?: string;

  isLogoStyle?: boolean;
  logoMarca?: string;
  logoSub?: string;

  temas?: string[];
  tecnicas?: string[];

  slug: string;

  whatsappPhone?: string;
  phoneNumber?: string;
  publicEmail?: string;
  website?: string;

  socialLinks?: any[];
}

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule, AppIcon],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio implements OnInit {

  // =====================================================
  // SERVICIOS
  // =====================================================

  private readonly specialistProfileService =
    inject(SpecialistProfileService);

  private readonly router =
    inject(Router);

  // =====================================================
  // ESTADO
  // =====================================================

  categoriaActiva =
    signal('todos');

  searchQuery =
    signal('');

  private readonly listado =
    signal<TarjetaDirectorio[]>([]);

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  // =====================================================
  // CARGAR PERFILES
  // =====================================================

  cargarPerfiles(): void {

    this.specialistProfileService
      .getPublicProfiles()
      .subscribe({

        next: (response) => {

          this.listado.set(

            response.content.map(perfil =>
              this.convertirPerfil(perfil)
            )

          );

        },

        error: (error) => {

          console.error(
            'Error al cargar perfiles:',
            error
          );

        }

      });

  }

  // =====================================================
  // CONVERTIR PERFIL
  // =====================================================

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

      ubicacionCompleta: 'Valencia, España',

      cita: perfil.biography,

      bio: perfil.biography,

      tags: [

        ...temas,

        ...tecnicas

      ].slice(0, 5),

      imagenUrl: this.specialistProfileService.resolveAssetUrl(perfil.photoUrl),

      bannerUrl: this.specialistProfileService.resolveAssetUrl(perfil.bannerUrl),

      temas,

      tecnicas,

      slug: perfil.slug,

      whatsappPhone: perfil.whatsappPhone,

      phoneNumber: perfil.phoneNumber,

      publicEmail: perfil.publicEmail,

      website: perfil.website,

      socialLinks: perfil.socialLinks,

      isLogoStyle: false

    };

  }

  // =====================================================
  // CONVERTIR TIPO
  // =====================================================

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

  // =====================================================
  // ICONO SEGÚN EL TIPO
  // =====================================================

  getIconName(
    tipo: TarjetaDirectorio['tipo']
  ): IconName {

    switch (tipo) {

      case 'Profesional':
        return 'user';

      case 'Centro':
        return 'users';

      case 'Organizador de eventos':
        return 'user';

      default:
        return 'user';

    }

  }

  // =====================================================
  // FILTRO
  // =====================================================

  perfilesFiltrados =
    computed(() => {

      const categoria =
        this.categoriaActiva();

      const query =
        this.searchQuery()
          .toLowerCase()
          .trim();

      return this.listado().filter(perfil => {

        const matchCategoria =

          categoria === 'todos'

          ||

          (categoria === 'profesionales'
            && perfil.tipo === 'Profesional')

          ||

          (categoria === 'centros'
            && perfil.tipo === 'Centro')

          ||

          (categoria === 'organizadores'
            && perfil.tipo === 'Organizador de eventos');

        const matchQuery =

          !query

          ||

          perfil.nombre
            .toLowerCase()
            .includes(query)

          ||

          perfil.ubicacion
            .toLowerCase()
            .includes(query)

          ||

          perfil.tags.some(tag =>
            tag.toLowerCase().includes(query)
          );

        return matchCategoria && matchQuery;

      });

    });

  // =====================================================
  // EVENTOS
  // =====================================================

  actualizarCategoria(
    categoria: string
  ): void {

    this.categoriaActiva.set(categoria);
  }

  actualizarBusqueda(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.searchQuery.set(input.value);
  }

  verPerfil(
    perfil: TarjetaDirectorio
  ): void {

    this.router.navigate([
      '/profesionales',
      perfil.slug
    ]);
  }
}
