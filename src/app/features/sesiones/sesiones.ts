import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LucideChevronDown } from '@lucide/angular';

import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import { OneToOneFilterOption, OneToOneServiceCardResponse } from '../../shared/models/one-to-one-service.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, LucideChevronDown],
  templateUrl: './sesiones.html',
  styleUrls: ['./sesiones.css']
})
export class SesionesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly oneToOneServices = inject(OneToOneServicesService);

  readonly sesiones = signal<OneToOneServiceCardResponse[]>([]);
  readonly totalSesiones = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtersError = signal<string | null>(null);
  readonly filtersLoading = signal(true);

  readonly workTopics = signal<OneToOneFilterOption[]>([]);
  readonly techniques = signal<OneToOneFilterOption[]>([]);
  readonly selectedWorkTopicId = signal<number | null>(null);
  readonly selectedTechniqueId = signal<number | null>(null);
  readonly openDropdown = signal<'topics' | 'techniques' | null>(null);
  readonly searchTerm = signal('');

  readonly pageSize = 12;
  readonly skeletonCards = Array.from({ length: 8 });
  readonly fallbackImage = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&auto=format&fit=crop&q=85';
  private currentPage = 0;
  private totalPages = 0;
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadSesiones(0);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/sesiones', id]);
  }

  cargarMas(): void {
    if (!this.hasMorePages() || this.loadingMore()) return;
    this.loadSesiones(this.currentPage + 1, true);
  }

  reintentar(): void {
    this.loadSesiones(0);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }
    this.searchDebounceId = setTimeout(() => this.loadSesiones(0), 300);
  }

  clearSearch(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
    this.searchTerm.set('');
    this.loadSesiones(0);
  }

  toggleDropdown(dropdown: 'topics' | 'techniques'): void {
    this.openDropdown.set(this.openDropdown() === dropdown ? null : dropdown);
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.openDropdown()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  selectWorkTopic(id: number | null): void {
    this.selectedWorkTopicId.set(id);
    this.openDropdown.set(null);
    this.loadSesiones(0);
  }

  selectTechnique(id: number | null): void {
    this.selectedTechniqueId.set(id);
    this.openDropdown.set(null);
    this.loadSesiones(0);
  }

  clearFilters(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = null;
    }
    this.searchTerm.set('');
    this.selectedWorkTopicId.set(null);
    this.selectedTechniqueId.set(null);
    this.openDropdown.set(null);
    this.loadSesiones(0);
  }

  hasActiveFilters(): boolean {
    return this.selectedWorkTopicId() !== null || this.selectedTechniqueId() !== null || this.searchTerm().trim() !== '';
  }

  selectedWorkTopicLabel(): string {
    const selectedId = this.selectedWorkTopicId();
    return this.workTopics().find(topic => topic.id === selectedId)?.name ?? 'Temas';
  }

  selectedTechniqueLabel(): string {
    const selectedId = this.selectedTechniqueId();
    return this.techniques().find(technique => technique.id === selectedId)?.name ?? 'Técnicas';
  }

  hasMorePages(): boolean {
    return this.currentPage + 1 < this.totalPages;
  }

  imageFor(sesion: OneToOneServiceCardResponse): string {
    return this.oneToOneServices.resolveAssetUrl(sesion.imageUrl) || this.fallbackImage;
  }

  specialistPhotoFor(sesion: OneToOneServiceCardResponse): string | null {
    return this.oneToOneServices.resolveAssetUrl(sesion.specialistPhotoUrl);
  }

  specialistInitial(sesion: OneToOneServiceCardResponse): string {
    return sesion.specialistName?.trim().charAt(0).toUpperCase() || 'S';
  }

  formatPrice(sesion: OneToOneServiceCardResponse): string {
    if (sesion.price === null || sesion.price === undefined || Number(sesion.price) === 0) {
      return 'Gratis';
    }

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: sesion.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(Number(sesion.price));
  }

  durationLabel(sesion: OneToOneServiceCardResponse): string {
    return sesion.durationMinutes ? `${sesion.durationMinutes} min` : 'Duracion por confirmar';
  }

  private loadFilterOptions(): void {
    this.filtersError.set(null);
    this.filtersLoading.set(true);

    forkJoin({
      topics: this.oneToOneServices.getActiveWorkTopics(),
      techniques: this.oneToOneServices.getActiveTechniques(),
    }).subscribe({
      next: ({ topics, techniques }) => {
        this.workTopics.set(topics);
        this.techniques.set(techniques);
        this.filtersLoading.set(false);

        // Si el tema o la tecnica seleccionados fueron desactivados, limpiamos la seleccion.
        let mustReload = false;
        if (this.selectedWorkTopicId() !== null && !topics.some(topic => topic.id === this.selectedWorkTopicId())) {
          this.selectedWorkTopicId.set(null);
          mustReload = true;
        }
        if (this.selectedTechniqueId() !== null && !techniques.some(technique => technique.id === this.selectedTechniqueId())) {
          this.selectedTechniqueId.set(null);
          mustReload = true;
        }
        if (mustReload) {
          this.loadSesiones(0);
        }
      },
      error: () => {
        this.filtersLoading.set(false);
        this.filtersError.set('No se pudieron cargar los filtros de temas y técnicas.');
      },
    });
  }

  private loadSesiones(page: number, append = false): void {
    append ? this.loadingMore.set(true) : this.loading.set(true);
    this.error.set(null);

    this.oneToOneServices.getPublicServices({
      page,
      size: this.pageSize,
      sort: 'createdAt,desc',
      search: this.searchTerm().trim(),
      workTopicId: this.selectedWorkTopicId(),
      techniqueId: this.selectedTechniqueId(),
    }).subscribe({
      next: response => {
        const content = response.content ?? [];
        this.sesiones.set(append ? [...this.sesiones(), ...content] : content);
        this.totalSesiones.set(response.totalElements ?? content.length);
        this.currentPage = response.number ?? page;
        this.totalPages = response.totalPages ?? 0;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        if (!append) {
          this.sesiones.set([]);
          this.totalSesiones.set(0);
        }
        this.error.set('El backend no esta disponible en este momento. No se pueden mostrar sesiones reales.');
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
