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

const CARD_GAP_PX = 12;

/** Cards visibles según ancho del viewport del carrusel */
function getCardsPerPage(viewportWidth: number): number {
  if (viewportWidth < 500)  return 1; // móvil vertical (<500px)
  if (viewportWidth < 900)  return 2; // móvil horizontal / tablet (500–899px)
  return 4;                            // desktop (≥900px)
}

@Component({
  selector: 'app-event-row',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-row.component.html',
  styleUrl:    './event-row.component.css',
})
export class EventRowComponent implements AfterViewInit, OnDestroy {

  title      = input.required<string>();
  seeAllPath = input<string>('/eventos');
  events     = input.required<EventItem[]>();

  @ViewChild('trackRef')    trackRef!:    ElementRef<HTMLUListElement>;
  @ViewChild('viewportRef') viewportRef!: ElementRef<HTMLDivElement>;

  private readonly currentPage  = signal(0);
  private readonly cardsPerPage = signal(4);
  readonly         cardWidth    = signal(0);

  readonly canPrev = computed(() => this.currentPage() > 0);
  readonly canNext = computed(() =>
    this.currentPage() + this.cardsPerPage() < this.events().length
  );

  private readonly platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.measureCard();
    this.resizeObserver = new ResizeObserver(() => this.measureCard());
    this.resizeObserver.observe(this.viewportRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private measureCard(): void {
    const viewportWidth = this.viewportRef.nativeElement.clientWidth;
    const cpp           = getCardsPerPage(viewportWidth);

    if (cpp !== this.cardsPerPage()) {
      this.cardsPerPage.set(cpp);
      this.currentPage.set(0);
      this.viewportRef.nativeElement.scrollTo({ left: 0, behavior: 'instant' });
    }

    const totalGap = (cpp - 1) * CARD_GAP_PX;
    const width    = Math.floor((viewportWidth - totalGap) / cpp);
    this.cardWidth.set(width);
  }

  prev(): void {
    const cpp  = this.cardsPerPage();
    const next = Math.max(0, this.currentPage() - cpp);
    this.currentPage.set(next);
    this.scrollToPage(next);
  }

  next(): void {
    const cpp     = this.cardsPerPage();
    const maxPage = this.events().length - cpp;
    const next    = Math.min(maxPage, this.currentPage() + cpp);
    this.currentPage.set(next);
    this.scrollToPage(next);
  }

  private scrollToPage(pageIndex: number): void {
    if (!this.viewportRef) return;
    const cardStride = this.cardWidth() + CARD_GAP_PX;
    this.viewportRef.nativeElement.scrollTo({
      left: pageIndex * cardStride,
      behavior: 'smooth',
    });
  }
}
