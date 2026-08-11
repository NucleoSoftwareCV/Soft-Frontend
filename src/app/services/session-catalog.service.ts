import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SessionCatalogItem, SessionCatalogUpsertRequest } from '../shared/models/one-to-one-service.model';

@Injectable({ providedIn: 'root' })
export class SessionCatalogService {
  private readonly http = inject(HttpClient);
  private readonly workTopicsUrl = `${environment.apiUrl}/work-topics`;
  private readonly techniquesUrl = `${environment.apiUrl}/techniques`;

  getWorkTopicsForAdmin(active?: boolean): Observable<SessionCatalogItem[]> {
    return this.http.get<SessionCatalogItem[]>(this.workTopicsUrl, { params: this.activeParams(active) });
  }

  createWorkTopic(request: SessionCatalogUpsertRequest): Observable<SessionCatalogItem> {
    return this.http.post<SessionCatalogItem>(this.workTopicsUrl, request);
  }

  updateWorkTopic(id: number, request: SessionCatalogUpsertRequest): Observable<SessionCatalogItem> {
    return this.http.put<SessionCatalogItem>(`${this.workTopicsUrl}/${id}`, request);
  }

  deactivateWorkTopic(id: number): Observable<void> {
    return this.http.patch<void>(`${this.workTopicsUrl}/${id}/desactivar`, {});
  }

  getTechniquesForAdmin(active?: boolean): Observable<SessionCatalogItem[]> {
    return this.http.get<SessionCatalogItem[]>(this.techniquesUrl, { params: this.activeParams(active) });
  }

  createTechnique(request: SessionCatalogUpsertRequest): Observable<SessionCatalogItem> {
    return this.http.post<SessionCatalogItem>(this.techniquesUrl, request);
  }

  updateTechnique(id: number, request: SessionCatalogUpsertRequest): Observable<SessionCatalogItem> {
    return this.http.put<SessionCatalogItem>(`${this.techniquesUrl}/${id}`, request);
  }

  deactivateTechnique(id: number): Observable<void> {
    return this.http.patch<void>(`${this.techniquesUrl}/${id}/desactivar`, {});
  }

  private activeParams(active?: boolean): HttpParams {
    let params = new HttpParams();
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return params;
  }
}
