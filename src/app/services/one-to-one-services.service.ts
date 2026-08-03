import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  OneToOneFilterOption,
  OneToOneServiceCardResponse,
  OneToOneServiceDetailResponse,
  OneToOneServicePageParams,
  SpringPage,
  OneToOneServiceRequest,
} from '../shared/models/one-to-one-service.model';

@Injectable({ providedIn: 'root' })
export class OneToOneServicesService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/one-to-one-services`;
  private readonly WORK_TOPICS = `${environment.apiUrl}/work-topics`;
  private readonly TECHNIQUES = `${environment.apiUrl}/techniques`;

  getPublicServices(params: OneToOneServicePageParams = {}): Observable<SpringPage<OneToOneServiceCardResponse>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<SpringPage<OneToOneServiceCardResponse>>(this.BASE, { params: httpParams });
  }

  getPublicService(id: number): Observable<OneToOneServiceDetailResponse> {
    return this.http.get<OneToOneServiceDetailResponse>(`${this.BASE}/${id}`);
  }

  getActiveWorkTopics(): Observable<OneToOneFilterOption[]> {
    return this.http.get<OneToOneFilterOption[]>(`${this.WORK_TOPICS}/active`);
  }

  getActiveTechniques(): Observable<OneToOneFilterOption[]> {
    return this.http.get<OneToOneFilterOption[]>(`${this.TECHNIQUES}/active`);
  }

  getMyServices(): Observable<OneToOneServiceDetailResponse[]> {
    return this.http.get<OneToOneServiceDetailResponse[]>(`${this.BASE}/my-services`);
  }

  createService(request: OneToOneServiceRequest): Observable<OneToOneServiceDetailResponse> {
    return this.http.post<OneToOneServiceDetailResponse>(this.BASE, request);
  }

  updateService(id: number, request: OneToOneServiceRequest): Observable<OneToOneServiceDetailResponse> {
    return this.http.put<OneToOneServiceDetailResponse>(`${this.BASE}/${id}`, request);
  }

  updateStatus(
    id: number,
    status: 'BORRADOR' | 'PUBLICADO' | 'OCULTO'
  ): Observable<OneToOneServiceDetailResponse> {
    return this.http.patch<OneToOneServiceDetailResponse>(
      `${this.BASE}/${id}/status`,
      null,
      { params: { status } }
    );
  }
}
