import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  CategoryResponse,
  CityResponse,
  EventCardResponse,
  EventDetailResponse,
  EventFilterParams,
  HomeEventSectionsResponse,
  SpringPage,
} from '../shared/models/evento.model';

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  private readonly http =
    inject(HttpClient);

  private readonly BASE =
    `${environment.apiUrl}`;

  getCategorias():
    Observable<CategoryResponse[]> {

    return this.http.get<CategoryResponse[]>(
      `${this.BASE}/categories`
    );

  }

  getCiudades():
    Observable<CityResponse[]> {

    return this.http.get<CityResponse[]>(
      `${this.BASE}/cities`
    );

  }

  getEventos(
    filters: EventFilterParams = {}
  ):
    Observable<SpringPage<EventCardResponse>> {

    let params =
      new HttpParams();

    Object.entries(filters)
      .forEach(([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {

          params =
            params.set(
              key,
              String(value)
            );

        }

      });

    return this.http.get<
      SpringPage<EventCardResponse>
    >(
      `${this.BASE}/events`,
      { params }
    );

  }

  getEvento(
    id: number
  ):
    Observable<EventDetailResponse> {

    return this.http.get<
      EventDetailResponse
    >(
      `${this.BASE}/events/${id}`
    );

  }

  // NUEVO
  getEventosPorOrganizador(
    organizerId: number
  ):
    Observable<SpringPage<EventCardResponse>> {

    const params =
      new HttpParams()
        .set('page', 0)
        .set('size', 100);

    return this.http.get<
      SpringPage<EventCardResponse>
    >(
      `${this.BASE}/events/${organizerId}/organizer-events`,
      { params }
    );

  }

  getHomeSections(
    cityName: string = 'Valencia',
    limit: number = 4
  ): Observable<HomeEventSectionsResponse> {

    const params = new HttpParams()
      .set('cityName', cityName)
      .set('limit', limit);

    return this.http.get<HomeEventSectionsResponse>(
      `${this.BASE}/home/event-sections`,
      { params }
    );

  }

}