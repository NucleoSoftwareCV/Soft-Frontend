import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SpecialistProfileService, SpecialistProfileResponse} from '../../../services/profesionales.service';
import { AppIcon, IconName } from '../../../shared/components/icon/icon';
import { TarjetaDirectorio } from '../../../shared/models/tarjeta-directorio.model';
import { toTarjetaDirectorio } from '../../../shared/utils/tarjeta-directorio.util';

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

    const tarjeta = toTarjetaDirectorio(
      perfil,
      url => this.specialistProfileService.resolveAssetUrl(url)
    );

    return {
      ...tarjeta,
      cita: perfil.biography,
      bio: perfil.biography,
      tags: tarjeta.tags.slice(0, 5),
    };
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
