import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EventosService } from '../../services/eventos.service';
import { FiltrosService } from '../../services/filtros.service';
import {
  CategoryResponse,
  EventCardResponse,
  EventFilterParams,
  EventModality,
  EventType,
} from '../../shared/models/evento.model';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar {
  private readonly eventosService = inject(EventosService);
  private readonly filtrosService = inject(FiltrosService);

  eventos = signal<EventCardResponse[]>([]);
  categorias = signal<CategoryResponse[]>([]);
  totalEventos = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  favoritos = signal<Set<number>>(new Set());

  readonly fallbackImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop&q=85';
  private lastRequestKey = '';

  constructor() {
    this.loadCategorias();

    effect(() => {
      const criteria = {
        categoryCatalog: this.categorias().map(category => category.id).join('|'),
        when: this.filterWhen(),
        categories: this.filterCategories().join('|'),
        types: this.filterTypes().join('|'),
        city: this.filterCity(),
        timeOfDay: this.filterTimeOfDay(),
        modality: this.filterModality(),
        recurrence: this.filterRecurrence(),
      };

      queueMicrotask(() => this.loadEventos(criteria));
    });
  }

  get filterWhen()       { return this.filtrosService.filterWhen; }
  get filterCategories() { return this.filtrosService.filterCategories; }
  get filterTypes()      { return this.filtrosService.filterTypes; }
  get filterCity()       { return this.filtrosService.filterCity; }
  get filterTimeOfDay()  { return this.filtrosService.filterTimeOfDay; }
  get filterModality()   { return this.filtrosService.filterModality; }
  get filterRecurrence() { return this.filtrosService.filterRecurrence; }
  get activeFilterCount(): number { return this.filtrosService.activeFilterCount; }

  categoriaOptions = computed(() => this.categorias().map(categoria => categoria.name).filter(Boolean));

  openHeaderFilter() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:open-filter'));
    }
  }

  selectWhen(option: string) {
    this.filtrosService.selectWhen(option);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oona:select-when', { detail: option }));
    }
  }

  toggleCategoria(cat: string) {
    this.filtrosService.toggleCategory(cat);
  }

  clearFilters() {
    this.filtrosService.clearFilters();
  }

  toggleFavorito(item: EventCardResponse) {
    this.favoritos.update(current => {
      const next = new Set(current);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      return next;
    });
  }

  isFavorito(item: EventCardResponse): boolean {
    return this.favoritos().has(item.id);
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

  private loadCategorias(): void {
    this.eventosService.getCategorias().subscribe({
      next: categorias => this.categorias.set(categorias.filter(categoria => categoria.active)),
      error: () => this.categorias.set([]),
    });
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
        this.error.set('No pudimos cargar los eventos. Intentalo nuevamente.');
        this.loading.set(false);
      },
    });
  }

  private buildFilters(): EventFilterParams {
    return {
      size: 24,
      ...this.dateRangeFor(this.filterWhen()),
      ...this.timeRangeFor(this.filterTimeOfDay()),
      categoryId: this.categoryIdFor(this.filterCategories()[0]),
      eventType: this.eventTypeFor(this.filterTypes()[0]),
      cityName: this.filterCity() !== 'Todas' ? this.filterCity() : undefined,
      modality: this.modalityFor(this.filterModality()),
      isRecurring: this.recurrenceFor(this.filterRecurrence()),
    };
  }

  private categoryIdFor(name: string | undefined): number | undefined {
    return this.categorias().find(categoria => categoria.name === name)?.id;
  }

  private modalityFor(value: string | null): EventModality | undefined {
    if (!value) return undefined;
    if (value.toLowerCase() === 'online') return EventModality.ONLINE;
    return EventModality.PRESENCIAL;
  }

  private recurrenceFor(value: string | null): boolean | undefined {
    if (!value) return undefined;
    return value === 'Recurrente';
  }

  private eventTypeFor(value: string | undefined): EventType | undefined {
    const map: Record<string, EventType> = {
      'Talleres': 'TALLER',
      'Retiros': 'RETIRO',
      'Clases': 'CLASE',
      'Ceremonias': 'CEREMONIA',
      'Encuentros Grupales': 'ENCUENTRO_GRUPAL',
      'Formaciones': 'FORMACION',
    };
    return value ? map[value] : undefined;
  }

  private timeRangeFor(value: string | null): Pick<EventFilterParams, 'hourFrom' | 'hourTo'> {
    const map: Record<string, Pick<EventFilterParams, 'hourFrom' | 'hourTo'>> = {
      'Manana': { hourFrom: 6, hourTo: 12 },
      'Mañana': { hourFrom: 6, hourTo: 12 },
      'Mediodia': { hourFrom: 12, hourTo: 16 },
      'Mediodía': { hourFrom: 12, hourTo: 16 },
      'Tarde': { hourFrom: 16, hourTo: 20 },
      'Noche': { hourFrom: 20, hourTo: 23 },
    };
    return value ? map[value] ?? {} : {};
  }

  private dateRangeFor(value: string | null): Pick<EventFilterParams, 'dateFrom' | 'dateTo'> {
    if (!value) return {};

    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    if (value === 'Mañana' || value === 'Manana') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 1);
    } else if (value === 'Este finde') {
      const day = today.getDay();
      const daysUntilSaturday = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
      start.setDate(today.getDate() + daysUntilSaturday);
      end.setDate(start.getDate() + 1);
    } else if (value === 'Esta semana') {
      end.setDate(today.getDate() + 7);
    } else if (value === 'Próxima semana' || value === 'Proxima semana') {
      start.setDate(today.getDate() + 7);
      end.setDate(today.getDate() + 14);
    }

    return {
      dateFrom: this.toDateParam(start),
      dateTo: this.toDateParam(end),
    };
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
