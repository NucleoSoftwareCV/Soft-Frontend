import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment.development';
import {
  EventOccurrenceResponse,
  EventOccurrencePublicResponse,
  CategoryResponse,
  CityResponse,
  EventFilterParams,
} from '../shared/models/evento.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}`;

  getCategorias(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.BASE}/categories`);
  }

  getCiudades(): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(`${this.BASE}/cities`);
  }

  getOcurrenciasPublicas(): Observable<EventOccurrencePublicResponse[]> {
    return this.http.get<EventOccurrencePublicResponse[]>(`${this.BASE}/event-occurrences/public`);
  }

  getOcurrenciasPorFecha(fecha: string): Observable<EventOccurrencePublicResponse[]> {
    return this.http.get<EventOccurrencePublicResponse[]>(`${this.BASE}/event-occurrences/public/date`, {
      params: new HttpParams().set('date', fecha),
    });
  }

  getOcurrenciasPorRango(startDate: string, endDate: string): Observable<EventOccurrencePublicResponse[]> {
    return this.http.get<EventOccurrencePublicResponse[]>(`${this.BASE}/event-occurrences/public/range`, {
      params: new HttpParams().set('startDate', startDate).set('endDate', endDate),
    });
  }

  filtrarOcurrencias(params: EventFilterParams): Observable<EventOccurrenceResponse[]> {
    let httpParams = new HttpParams();
    if (params.dateFilter) httpParams = httpParams.set('dateFilter', params.dateFilter);
    if (params.timeFilter) httpParams = httpParams.set('timeFilter', params.timeFilter);
    if (params.selectedDate) httpParams = httpParams.set('selectedDate', params.selectedDate);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.cityId) httpParams = httpParams.set('cityId', params.cityId);
    if (params.modality) httpParams = httpParams.set('modality', params.modality);
    if (params.priceMin !== undefined && params.priceMin !== null) httpParams = httpParams.set('priceMin', params.priceMin);
    if (params.priceMax !== undefined && params.priceMax !== null) httpParams = httpParams.set('priceMax', params.priceMax);

    return this.http.get<EventOccurrenceResponse[]>(`${this.BASE}/event-occurrences/filter`, {
      params: httpParams,
    });
  }
}
