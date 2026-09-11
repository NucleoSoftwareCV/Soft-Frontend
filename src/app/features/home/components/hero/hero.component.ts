import { Component, inject, PLATFORM_ID, signal, output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SearchCategoryMatch, SearchResults, SearchService } from '../../../../services/search.service';
import { FiltrosService } from '../../../../services/filtros.service';
import { EventCardResponse } from '../../../../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../../../../shared/models/one-to-one-service.model';
import { SpecialistProfileResponse } from '../../../../services/profesionales.service';
import { resolveAssetUrl } from '../../../../shared/utils/asset-url.util';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly filtrosService = inject(FiltrosService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  searchQuery     = signal('');
  isSearchFocused = signal(false);
  city            = signal('Valencia');
  searchResults   = signal<SearchResults | null>(null);
  searching       = signal(false);

  /** Emite hacia el HomeComponent para abrir el modal de filtros del Header */
  openFilter = output<void>();

  inspirationTags = [
    'Yoga',           'Meditación',
    'Baño de sonido', 'Baño de hielo',
    'Breathwork',     'Retiro',
  ];

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$       .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          const trimmed = query.trim();
          if (!trimmed) {
            this.searching.set(false);
            return [null];
          }
          this.searching.set(true);
          return this.searchService.search(trimmed);
        }),
        takeUntilDestroyed()
      )
      .subscribe(results => {
        this.searching.set(false);
        this.searchResults.set(results);
      });
  }

  onFocus(): void { this.isSearchFocused.set(true); }
  onBlur():  void { setTimeout(() => this.isSearchFocused.set(false), 180); }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value.trim()) {
      this.searching.set(true);
    } else {
      this.searching.set(false);
      this.searchResults.set(null);
    }
    this.searchInput$.next(value);
  }

  selectTag(tag: string): void {
    this.onSearchInput(tag);
  }

  goToAllResults(): void {
    const query = this.searchQuery().trim();
    if (!query) return;
    this.closeSearch();
    this.router.navigate(['/explorar'], { queryParams: { q: query } });
  }

  selectSearchCategory(category: SearchCategoryMatch): void {
    this.filtrosService.filterCategories.set([category.name]);
    this.closeSearch();
    this.router.navigate(['/explorar']);
  }

  selectSearchEvent(event: EventCardResponse): void {
    this.closeSearch();
    this.router.navigate(['/evento', event.id]);
  }

  selectSearchSession(session: OneToOneServiceCardResponse): void {
    this.closeSearch();
    this.router.navigate(['/sesiones', session.id]);
  }

  selectSearchOrganizer(organizer: SpecialistProfileResponse): void {
    this.closeSearch();
    this.router.navigate(['/profesionales', organizer.slug]);
  }

  resolveImage(url?: string | null): string {
    return url ? resolveAssetUrl(url) : '';
  }

  formatSearchDate(value: string | null): string {
    if (!value) return 'Fecha por confirmar';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
      .format(new Date(value))
      .replace('.', '');
  }

  private closeSearch(): void {
    this.isSearchFocused.set(false);
    this.searchQuery.set('');
    this.searchResults.set(null);
  }
}