import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { AppIcon } from '../../../shared/components/icon/icon';
import { SpecialistProfileService } from '../../../services/profesionales.service';
import {
  DirectoryFeaturedService, DirectoryProfile, DirectoryType,
  ProfessionalDirectoryService,
} from '../../../services/professional-directory.service';

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIcon],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio implements OnInit {
  private readonly service = inject(ProfessionalDirectoryService);
  private readonly assets = inject(SpecialistProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new Subject<void>();

  search = '';
  location = '';
  readonly type = signal<DirectoryType>('professionals');
  readonly specialty = signal('');
  readonly profiles = signal<DirectoryProfile[]>([]);
  readonly specialties = signal<string[]>([]);
  readonly featured = signal<DirectoryFeaturedService | null>(null);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly appliedSearch = signal('');
  private readonly appliedLocation = signal('');
  readonly types: { value: DirectoryType; label: string }[] = [
    { value: 'professionals', label: 'Profesionales' },
    { value: 'centers', label: 'Centros' },
  ];

  ngOnInit(): void {
    this.requests.pipe(
      switchMap(() => {
        this.loading.set(true);
        this.error.set(false);
        this.profiles.set([]);
        this.featured.set(null);
        return this.service.get({ search: this.appliedSearch(), location: this.appliedLocation(),
          type: this.type(), specialty: this.specialty(), page: this.page() }).pipe(
          catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      this.loading.set(false);
      if (!response) {
        this.error.set(true);
        return;
      }
      this.profiles.set(response.content);
      this.total.set(response.totalElements);
      this.specialties.set(response.specialties);
      this.featured.set(response.featured);
    });
    this.requests.next();
  }

  buscar(): void {
    this.appliedSearch.set(this.search.trim());
    this.appliedLocation.set(this.location.trim());
    this.page.set(0);
    this.requests.next();
  }

  cambiarTipo(type: DirectoryType): void {
    this.type.set(type);
    this.specialty.set('');
    this.page.set(0);
    this.requests.next();
  }

  cambiarEspecialidad(value: string): void {
    this.specialty.set(value);
    this.page.set(0);
    this.requests.next();
  }

  cambiarPagina(delta: number): void {
    const next = this.page() + delta;
    if (next < 0 || next * 20 >= this.total() || this.loading()) return;
    this.page.set(next);
    this.requests.next();
  }

  reintentar(): void { this.requests.next(); }

  limpiar(): void {
    this.search = '';
    this.location = '';
    this.type.set('professionals');
    this.specialty.set('');
    this.buscar();
  }

  asset(url: string | null): string | undefined {
    return this.assets.resolveAssetUrl(url ?? undefined);
  }

  imageError(event: Event): void {
    // La inicial o el fondo siguen visibles; no se inventan fotografías.
    (event.target as HTMLImageElement).hidden = true;
  }

  initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  rating(value: number): string {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }

  price(value: number, currency: string | null): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 2,
    }).format(value);
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
    }).format(new Date(value));
  }

  serviceRoute(service: DirectoryFeaturedService): (string | number)[] {
    return [service.type === 'EVENT' ? '/evento' : '/sesiones', service.id];
  }
}
