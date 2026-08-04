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
  SpringPage,
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

  getEventos(filters: EventFilterParams = {}): Observable<SpringPage<EventCardResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<SpringPage<EventCardResponse>>(`${this.BASE}/events`, { params });
  }

  getEvento(id: number): Observable<EventDetailResponse> {
    return this.http.get<EventDetailResponse>(`${this.BASE}/events/${id}`);
  }

  resolveAssetUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (!environment.apiUrl.startsWith('http')) return url;

    const apiOrigin = new URL(environment.apiUrl).origin;
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
