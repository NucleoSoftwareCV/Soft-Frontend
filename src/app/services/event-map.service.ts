import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventMapPoint } from '../shared/models/event-map.model';
import { SpringPage } from '../shared/models/evento.model';

@Injectable({ providedIn: 'root' })
export class EventMapService {
  private readonly http = inject(HttpClient);

  getPage(page = 0): Observable<SpringPage<EventMapPoint>> {
    const params = new HttpParams().set('page', page).set('size', 100);
    return this.http.get<SpringPage<EventMapPoint>>(
      environment.apiUrl + '/events/map', { params },
    );
  }

  /** El mapa general consulta todas las páginas, independientemente del catálogo. */
  getAllPoints(): Observable<EventMapPoint[]> {
    return this.getPage().pipe(
      expand(page => page.number + 1 < page.totalPages
        ? this.getPage(page.number + 1)
        : EMPTY),
      reduce((points, page) => [...points, ...page.content], [] as EventMapPoint[]),
      map(points => [...new Map(points.map(point => [point.occurrenceId, point])).values()]),
    );
  }
}
