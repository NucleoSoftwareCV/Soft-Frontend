import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CityResponse } from '../shared/models/evento.model';

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cities`;

  getCities(): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(this.base);
  }

  getCitiesForAdmin(active?: boolean): Observable<CityResponse[]> {
    let params = new HttpParams();
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return this.http.get<CityResponse[]>(`${this.base}/admin`, { params });
  }

  createCity(city: Partial<CityResponse>): Observable<CityResponse> {
    return this.http.post<CityResponse>(this.base, city);
  }

  updateCity(id: number, city: Partial<CityResponse>): Observable<CityResponse> {
    return this.http.put<CityResponse>(`${this.base}/${id}`, city);
  }

  deleteCity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
