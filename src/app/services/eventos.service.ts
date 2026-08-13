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
  EventOccurrenceCalendarResponse,
  HomeEventSectionsResponse,
  SpringPage,
} from '../shared/models/evento.model';
import { ExperienceTypeCatalogItem } from '../shared/models/event-catalog.model';

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

  getExperienceTypes(): Observable<ExperienceTypeCatalogItem[]> {
    return this.http.get<ExperienceTypeCatalogItem[]>(`${this.BASE}/experience-types`);
  }

  getEventos(filters: EventFilterParams = {}): Observable<SpringPage<EventCardResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<SpringPage<EventCardResponse>>(
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

  getEventosSimilares(
    eventId: number,
    page = 0,
    size = 12
  ): Observable<SpringPage<EventCardResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'startsAt,asc');

    return this.http.get<SpringPage<EventCardResponse>>(
      `${this.BASE}/events/${eventId}/similar`,
      { params }
    );
  }

  getOtrosEventosDelOrganizador(
    eventId: number,
    page = 0,
    size = 12
  ): Observable<SpringPage<EventCardResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'startsAt,asc');

    return this.http.get<SpringPage<EventCardResponse>>(
      `${this.BASE}/events/${eventId}/organizer-events`,
      { params }
    );
  }

  getEventosPorEspecialista(
    specialistId: number
  ):
    Observable<SpringPage<EventCardResponse>> {

    const params =
      new HttpParams()
        .set('specialistId', specialistId)
        .set('page', 0)
        .set('size', 100);

    return this.http.get<
      SpringPage<EventCardResponse>
    >(
      `${this.BASE}/events`,
      { params }
    );

  }

  getPublicCalendar(
    specialistId: number,
    dateFrom: string,
    dateTo: string
  ): Observable<EventOccurrenceCalendarResponse[]> {

    const params = new HttpParams()
      .set('specialistId', specialistId)
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);

    return this.http.get<EventOccurrenceCalendarResponse[]>(
      `${this.BASE}/event-occurrences/public`,
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

  resolveAssetUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (!environment.apiUrl.startsWith('http')) return url;

    const apiOrigin = new URL(environment.apiUrl).origin;
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
