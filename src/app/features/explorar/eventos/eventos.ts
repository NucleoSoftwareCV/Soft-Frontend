import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventosService } from '../../../services/eventos.service';
import { FiltrosService } from '../../../services/filtros.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  EventCardResponse,
  EventFilterParams,
  EventModality,
} from '../../../shared/models/evento.model';
import { categoryIcon } from '../../../shared/utils/category-icon.util';

interface EventSortOption {
  label: string;
  sort: string;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink],

  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class Eventos {
  private readonly eventosService = inject(EventosService);
  private readonly filtrosService = inject(FiltrosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  searchQuery = signal<string>('');
  eventos = signal<EventCardResponse[]>([]);
  totalEventos = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);
  readonly favoritos = this.favoritesService.favoritedEventIds;

  showDatePicker = signal(false);
  showSortMenu = signal(false);
  expandedDescription = signal(false);
  customDateFrom = signal(this.toDateParam(new Date()));
  customDateTo = signal(this.toDateParam(new Date()));

  readonly skeletonCards = Array.from({ length: 8 });
  readonly fallbackImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';
  readonly sortOptions: EventSortOption[] = [
    { label: 'Fecha más próxima', sort: 'startsAt,asc' },
    { label: 'Recién añadidos', sort: 'createdAt,desc' },
    { label: 'Precio (de menor a mayor)', sort: 'priceFrom,asc' },
    { label: 'Precio (de mayor a menor)', sort: 'priceFrom,desc' },
  ];
  selectedSort = signal<EventSortOption>(this.sortOptions[0]);
  private lastRequestKey = '';

  assetUrl(url: string | null | undefined, fallback = this.fallbackImage): string {
    return this.eventosService.resolveAssetUrl(url) ?? fallback;
  }

  constructor() {
    this.searchQuery.set(this.route.snapshot.queryParamMap.get('q') ?? '');

    effect(() => {
      const criteria = {
        catalog: this.filtrosService.categories().map(c => c.id).join('|')
          + '/' + this.filtrosService.experienceTypes().map(t => t.id).join('|'),
        when: this.filterWhen(),
        categories: this.filterCategories().join('|'),
        types: this.filterTypes().join('|'),
        city: this.filterCity(),
        timeOfDay: this.filterTimeOfDay(),
        modality: this.filterModality(),
        recurrence: this.filterRecurrence(),
        price: this.filterPrice(),
        search: this.searchQuery(),
        sort: this.selectedSort().sort,
      };

      queueMicrotask(() => this.loadEventos(criteria));
    });
  }

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  get filterWhen()       { return this.filtrosService.filterWhen; }
  get filterCategories() { return this.filtrosService.filterCategories; }
  get filterTypes()      { return this.filtrosService.filterTypes; }
  get filterCity()       { return this.filtrosService.filterCity; }
  get filterTimeOfDay()  { return this.filtrosService.filterTimeOfDay; }
  get filterModality()   { return this.filtrosService.filterModality; }
  get filterRecurrence() { return this.filtrosService.filterRecurrence; }
  get filterPrice()      { return this.filtrosService.filterPrice; }
  get activeFilterCount(): number { return this.filtrosService.activeFilterCount; }

  openHeaderFilter() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:open-filter'));
    }
  }
  openHeaderDateModal(): void {
  window.dispatchEvent(new CustomEvent('oona:open-date-modal'));
  }
  selectWhen(option: string) {
    this.showDatePicker.set(false);
    this.filtrosService.selectWhen(option);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:select-when', { detail: option }));
    }
  }

  toggleDatePicker(): void {
    this.showDatePicker.update(value => !value);
  }

  updateCustomDateFrom(event: Event): void {
    this.customDateFrom.set((event.target as HTMLInputElement).value);
  }

  updateCustomDateTo(event: Event): void {
    this.customDateTo.set((event.target as HTMLInputElement).value);
  }

  applyCustomDateRange(): void {
    const from = this.customDateFrom();
    const to = this.customDateTo() || from;
    this.filtrosService.filterWhen.set(`RANGO:${from}:${to}`);
    this.showDatePicker.set(false);
  }

  clearDateFilter(): void {
    this.filtrosService.filterWhen.set(null);
    this.showDatePicker.set(false);
  }

  toggleSortMenu(): void {
    this.showSortMenu.update(value => !value);
  }

  selectSort(option: EventSortOption): void {
    this.selectedSort.set(option);
    this.showSortMenu.set(false);
  }

  toggleDescription(): void {
    this.expandedDescription.update(value => !value);
  }

  isCustomDateActive(): boolean {
    return this.filterWhen()?.startsWith('RANGO:') ?? false;
  }

  customDateLabel(): string {
    if (!this.isCustomDateActive()) return 'Elegir fecha';
    const [, from, to] = this.filterWhen()?.split(':') ?? [];
    return from === to ? this.formatShortDate(from) : `${this.formatShortDate(from)} - ${this.formatShortDate(to)}`;
  }

  clearFilters() {
    this.showDatePicker.set(false);
    this.filtrosService.clearFilters();
  }

  toggleFavorito(item: EventCardResponse) {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.favoritesService.toggleFavorite('EVENTO', item.id).subscribe({
      error: err => {
        console.error('Error toggling favorite', err);
      }
    });
  }

  isFavorito(item: EventCardResponse): boolean {
    return this.favoritos().has(item.id);
  }

  categoryEmoji(name: string | null): string {
    return categoryIcon(name);
  }

  isOnline(item: EventCardResponse): boolean {
    return item.modality === EventModality.ONLINE;
  }

  formatDate(value: string | null): string {
    if (!value) return 'Fecha por confirmar';
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatPrice(item: EventCardResponse): string {
    if (item.priceFrom === null || item.priceFrom === undefined) return 'Gratis';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: item.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(item.priceFrom);
  }

  private loadEventos(criteria: Record<string, string | null>): void {
    const requestKey = JSON.stringify(criteria);
    if (requestKey === this.lastRequestKey) return;
    this.lastRequestKey = requestKey;

    this.loading.set(true);
    this.error.set(null);

    this.eventosService.getEventos(this.buildFilters()).subscribe({
      next: page => {
        this.eventos.set(page.content ?? []);
        this.totalEventos.set(page.totalElements ?? page.content?.length ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.eventos.set([]);
        this.totalEventos.set(0);
        this.error.set('El backend no está disponible en este momento. No se pueden mostrar eventos reales.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Mismos parámetros que usa el contador en vivo del modal del header
   * (FiltrosService.buildEventFilterParams), garantizando que el número
   * del botón y este listado siempre coincidan.
   */
  private buildFilters(): EventFilterParams {
    return {
      size: 24,
      sort: this.selectedSort().sort,
      search: this.searchQuery().trim() || undefined,
      ...this.filtrosService.buildEventFilterParams(this.filtrosService.snapshot()),
    };
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatShortDate(value: string | undefined): string {
    if (!value) return 'Fecha';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(`${value}T00:00:00`));
  }
}