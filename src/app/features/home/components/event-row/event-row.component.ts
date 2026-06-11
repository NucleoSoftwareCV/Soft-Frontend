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
import { RouterLink } from '@angular/router';

export interface EventItem {
  id:         number;
  title:      string;
  dateLabel:  string;
  recurrent:  boolean;
  location:   string;
  host:       string;
  hostAvatar: string;
  image:      string;
  spotsLeft:  number | null;
}

/** Cuántas cards se muestran a la vez (y cuántas avanza cada flecha) */
const CARDS_PER_PAGE = 4;
/** Gap entre cards en px — debe coincidir con el CSS */
const CARD_GAP_PX = 16;

@Component({
  selector: 'app-event-row',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-row.component.html',
  styleUrl:    './event-row.component.css',
})
export class EventRowComponent implements AfterViewInit, OnDestroy {

  /* ── Inputs ── */
  title      = input.required<string>();
  seeAllPath = input<string>('/eventos');
  events     = input.required<EventItem[]>();

  /* ── Refs ── */
  @ViewChild('trackRef') trackRef!: ElementRef<HTMLUListElement>;
  @ViewChild('viewportRef') viewportRef!: ElementRef<HTMLDivElement>;

  /* ── Estado ── */
  /** Índice de la primera card visible (múltiplo de CARDS_PER_PAGE) */
  private readonly currentPage = signal(0);

  /** Ancho calculado de cada card en px */
  readonly cardWidth = signal(0);

  /* ── Computed ── */
  readonly canPrev = computed(() => this.currentPage() > 0);

  readonly canNext = computed(() =>
    this.currentPage() + CARDS_PER_PAGE < this.events().length
  );

  /* ── Platform ── */
  private readonly platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;

  /* ────────────────────────────────────────── */

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.measureCard();
    // Recalcular si el contenedor cambia de tamaño (responsive)
    this.resizeObserver = new ResizeObserver(() => this.measureCard());
    this.resizeObserver.observe(this.viewportRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /** Calcula el ancho de card para que quepan exactamente CARDS_PER_PAGE */
  private measureCard(): void {
    const viewportWidth = this.viewportRef.nativeElement.clientWidth;
    const totalGap      = (CARDS_PER_PAGE - 1) * CARD_GAP_PX;
    const width         = Math.floor((viewportWidth - totalGap) / CARDS_PER_PAGE);
    this.cardWidth.set(width);
  }

  /** Navega al grupo de cards anterior */
  prev(): void {
    const next = Math.max(0, this.currentPage() - CARDS_PER_PAGE);
    this.currentPage.set(next);
    this.scrollToPage(next);
  }

  /** Navega al grupo de cards siguiente */
  next(): void {
    const maxPage = this.events().length - CARDS_PER_PAGE;
    const next    = Math.min(maxPage, this.currentPage() + CARDS_PER_PAGE);
    this.currentPage.set(next);
    this.scrollToPage(next);
  }

  /** Desplaza el track hasta la posición correcta */
  private scrollToPage(pageIndex: number): void {
    if (!this.viewportRef) return;
    const cardStride = this.cardWidth() + CARD_GAP_PX;
    this.viewportRef.nativeElement.scrollTo({
      left:     pageIndex * cardStride,
      behavior: 'smooth',
    });
  }
}
