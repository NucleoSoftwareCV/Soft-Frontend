import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { OneToOneServicesService } from '../../services/one-to-one-services.service';
import { OneToOneFilterOption, OneToOneServiceCardResponse } from '../../shared/models/one-to-one-service.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule],
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
    return this.techniques().find(technique => technique.id === selectedId)?.name ?? 'Tipos';
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

    this.oneToOneServices.getActiveWorkTopics().subscribe({
      next: topics => this.workTopics.set(topics),
      error: () => this.filtersError.set('No se pudieron cargar los filtros de temas.'),
    });

    this.oneToOneServices.getActiveTechniques().subscribe({
      next: techniques => this.techniques.set(techniques),
      error: () => this.filtersError.set('No se pudieron cargar los filtros de tipos.'),
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
