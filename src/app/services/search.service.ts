import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { EventosService } from './eventos.service';
import { OneToOneServicesService } from './one-to-one-services.service';
import { SpecialistProfileService, SpecialistProfileResponse } from './profesionales.service';
import { FiltrosService } from './filtros.service';
import { EventCardResponse } from '../shared/models/evento.model';
import { OneToOneServiceCardResponse } from '../shared/models/one-to-one-service.model';

export interface SearchCategoryMatch {
  id: number;
  name: string;
  emoji: string;
}

export interface SearchResults {
  query: string;
  categories: SearchCategoryMatch[];
  events: EventCardResponse[];
  sessions: OneToOneServiceCardResponse[];
  organizers: SpecialistProfileResponse[];
  isEmpty: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly eventosService = inject(EventosService);
  private readonly sessionsService = inject(OneToOneServicesService);
  private readonly profilesService = inject(SpecialistProfileService);
  private readonly filtros = inject(FiltrosService);

  search(query: string): Observable<SearchResults> {
    const trimmed = query.trim();
    if (!trimmed) {
      return of(this.emptyResults(trimmed));
    }

    const needle = trimmed.toLowerCase();
    const categories: SearchCategoryMatch[] = this.filtros
      .categories()
      .filter(category => category.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map(category => ({ id: category.id, name: category.name, emoji: category.emoji || '✨' }));

    return forkJoin({
      events: this.eventosService.getEventos({ search: trimmed, size: 5 })
        .pipe(catchError(() => of({ content: [] } as any))),
      sessions: this.sessionsService.getPublicServices({ search: trimmed, size: 3 })
        .pipe(catchError(() => of({ content: [] } as any))),
      organizers: this.profilesService.getPublicProfiles(undefined, trimmed, 3)
        .pipe(catchError(() => of({ content: [] } as any))),
    }).pipe(
      map(({ events, sessions, organizers }) => {
        const result: SearchResults = {
          query: trimmed,
          categories,
          events: events.content ?? [],
          sessions: sessions.content ?? [],
          organizers: organizers.content ?? [],
          isEmpty: false,
        };
        result.isEmpty =
          categories.length === 0 &&
          result.events.length === 0 &&
          result.sessions.length === 0 &&
          result.organizers.length === 0;
        return result;
      }),
    );
  }

  private emptyResults(query: string): SearchResults {
    return { query, categories: [], events: [], sessions: [], organizers: [], isEmpty: true };
  }
}
