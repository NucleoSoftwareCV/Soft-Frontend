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

   isDropdownOpen =
    signal(false);

  cargando =
    signal(false);

  totalPerfiles =
    signal(0);

  private readonly listado =
    signal<TarjetaDirectorio[]>([]);

  // Perfiles solicitados por peticion al backend y tope de seguridad
  // para no colgar la app si el directorio crece mucho.
  private static readonly PAGE_SIZE = 50;
  private static readonly MAX_PERFILES = 500;

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

    this.cargando.set(true);

    this.cargarPagina(0, []);

  }

  // =====================================================
  // CARGA PAGINADA ACUMULATIVA
  // =====================================================

  // El backend pagina los perfiles (10 por defecto, aqui pedimos
  // 50 por peticion). Mientras queden paginas (page + 1 < totalPages)
  // y no se supere el tope de seguridad, se pide la siguiente pagina
  // y se acumula. Asi el filtro por categoria y la busqueda en cliente
  // se aplican sobre el directorio COMPLETO y no solo sobre la pagina 0.
  private cargarPagina(
    page: number,
    acumulado: SpecialistProfileResponse[]
  ): void {

    this.specialistProfileService
      .getPublicProfiles(
        undefined,
        undefined,
        Directorio.PAGE_SIZE,
        page
      )
      .subscribe({

        next: (response) => {

          const perfiles = [...acumulado, ...(response.content ?? [])];

          const quedanPaginas =
            page + 1 < (response.totalPages ?? 0);

          const dentroDelTope =
            perfiles.length < Directorio.MAX_PERFILES;

          if (quedanPaginas && dentroDelTope) {

            this.cargarPagina(page + 1, perfiles);

            return;

          }

          this.listado.set(
            perfiles.map(perfil =>
              this.convertirPerfil(perfil)
            )
          );

          this.totalPerfiles.set(perfiles.length);

          this.cargando.set(false);

        },

        error: (error) => {

          console.error(
            'Error al cargar perfiles:',
            error
          );

          // Si ya habiamos acumulado perfiles de paginas anteriores,
          // los mostramos en lugar de dejar la pagina vacia.
          this.listado.set(
            acumulado.map(perfil =>
              this.convertirPerfil(perfil)
            )
          );

          this.totalPerfiles.set(acumulado.length);

          this.cargando.set(false);

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
