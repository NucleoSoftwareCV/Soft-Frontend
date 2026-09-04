
import {
  Component,
  input,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AppIcon } from '../../../../shared/components/icon/icon';

import { FavoritesService } from '../../../../services/favorites.service';
import { AuthService } from '../../../../core/services/auth.service';


export interface EventItem {
  id: number;
  title: string;
  dateLabel: string;
  recurrent: boolean;
  location: string;
  host: string;
  hostAvatar: string;
  image: string;
  spotsLeft: number | null;
}

const CARD_GAP_PX = 12;

/** Cards visibles según ancho del viewport del carrusel */
function getCardsPerPage(viewportWidth: number): number {
  if (viewportWidth < 500) return 1;
  if (viewportWidth < 900) return 2;
  return 4;
}

@Component({
  selector: 'app-event-row',
  standalone: true,
  imports: [RouterLink, AppIcon],
  templateUrl: './event-row.component.html',
  styleUrl: './event-row.component.css',
})
export class EventRowComponent implements AfterViewInit, OnDestroy {

  title = input.required<string>();
  seeAllPath = input<string>('/eventos');
  events = input.required<EventItem[]>();

  @ViewChild('trackRef')
  trackRef!: ElementRef<HTMLUListElement>;

  @ViewChild('viewportRef')
  viewportRef!: ElementRef<HTMLDivElement>;

  private readonly currentPage = signal(0);
  private readonly cardsPerPage = signal(4);

  readonly cardWidth = signal(0);

  readonly canPrev = computed(() =>
    this.currentPage() > 0
  );

  readonly canNext = computed(() =>
    this.currentPage() + this.cardsPerPage() < this.events().length
  );

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private resizeObserver?: ResizeObserver;


  // =========================================================
  // FAVORITOS
  // Misma lógica utilizada en Explorar
  // =========================================================

  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);

  /**
   * Eventos favoritos que ya están guardados.
   */
  readonly favoritos = this.favoritesService.favoritedEventIds;

  /**
   * Control de la card flotante cuando el usuario
   * todavía no ha iniciado sesión.
   */
  showFavoriteLoginCard = signal(false);


  /**
   * BOTÓN CORAZÓN
   *
   * Usuario NO autenticado:
   *   → no intenta llamar al backend
   *   → muestra la card flotante.
   *
   * Usuario autenticado:
   *   → guarda/elimina directamente el favorito.
   */
  toggleFavorito(item: EventItem): void {

    if (!this.authService.isLoggedIn) {

      this.showFavoriteLoginCard.set(true);

      return;
    }

    this.favoritesService
      .toggleFavorite('EVENTO', item.id)
      .subscribe({

        error: error => {

          console.error(
            'Error toggling favorite',
            error
          );

        }

      });

  }


  /**
   * Comprueba si el evento está guardado.
   */
  isFavorito(item: EventItem): boolean {

    return this.favoritos().has(item.id);

  }


  /**
   * Cierra la card flotante.
   */
  cerrarFavoriteLoginCard(): void {

    this.showFavoriteLoginCard.set(false);

  }


  /**
   * Lleva al usuario al login.
   *
   * Como esta card pertenece a Home,
   * después del login se debe regresar a Home.
   */
  irAAuthLogin(): void {

    this.showFavoriteLoginCard.set(false);

    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: '/'
      }
    });

  }


  // =========================================================
  // CARRUSEL — NO MODIFICADO
  // =========================================================

  ngAfterViewInit(): void {

    if (!isPlatformBrowser(this.platformId)) return;

    this.measureCard();

    this.resizeObserver = new ResizeObserver(() =>
      this.measureCard()
    );

    this.resizeObserver.observe(
      this.viewportRef.nativeElement
    );

  }


  ngOnDestroy(): void {

    this.resizeObserver?.disconnect();

  }


  private measureCard(): void {

    const viewportWidth =
      this.viewportRef.nativeElement.clientWidth;

    const cpp =
      getCardsPerPage(viewportWidth);

    if (cpp !== this.cardsPerPage()) {

      this.cardsPerPage.set(cpp);
      this.currentPage.set(0);

      this.viewportRef.nativeElement.scrollTo({
        left: 0,
        behavior: 'instant'
      });

    }

    const totalGap =
      (cpp - 1) * CARD_GAP_PX;

    const width =
      Math.floor(
        (viewportWidth - totalGap) / cpp
      );

    this.cardWidth.set(width);

  }


  prev(): void {

    const cpp = this.cardsPerPage();

    const next =
      Math.max(
        0,
        this.currentPage() - cpp
      );

    this.currentPage.set(next);

    this.scrollToPage(next);

  }


  next(): void {

    const cpp =
      this.cardsPerPage();

    const maxPage =
      this.events().length - cpp;

    const next =
      Math.min(
        maxPage,
        this.currentPage() + cpp
      );

    this.currentPage.set(next);

    this.scrollToPage(next);

  }


  private scrollToPage(pageIndex: number): void {

    if (!this.viewportRef) return;

    const cardStride =
      this.cardWidth() + CARD_GAP_PX;

    this.viewportRef.nativeElement.scrollTo({
      left: pageIndex * cardStride,
      behavior: 'smooth',
    });

  }

}

