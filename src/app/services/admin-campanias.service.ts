import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AdminCampaign,
  AdminCampaignEntry,
  CampaignStatus,
  CampaignUpsertRequest,
} from '../shared/models/campania.model';

/** Gestión de campañas promocionales desde el panel de administración. */
@Injectable({ providedIn: 'root' })
export class AdminCampaniasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/campaigns`;

  list(): Observable<AdminCampaign[]> {
    return this.http.get<AdminCampaign[]>(this.base);
  }

  get(id: number): Observable<AdminCampaign> {
    return this.http.get<AdminCampaign>(`${this.base}/${id}`);
  }

  create(request: CampaignUpsertRequest): Observable<AdminCampaign> {
    return this.http.post<AdminCampaign>(this.base, request);
  }

  update(id: number, request: CampaignUpsertRequest): Observable<AdminCampaign> {
    return this.http.put<AdminCampaign>(`${this.base}/${id}`, request);
  }

  uploadImage(id: number, file: File): Observable<AdminCampaign> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AdminCampaign>(`${this.base}/${id}/image`, formData);
  }

  updateStatus(id: number, status: CampaignStatus): Observable<AdminCampaign> {
    return this.http.patch<AdminCampaign>(`${this.base}/${id}/status`, { status });
  }

  replaceEvents(id: number, eventIds: number[]): Observable<AdminCampaign> {
    return this.http.put<AdminCampaign>(`${this.base}/${id}/events`, { eventIds });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  draw(id: number): Observable<AdminCampaign> {
    return this.http.post<AdminCampaign>(`${this.base}/${id}/draw`, {});
  }

  entries(id: number, status?: 'VALIDA' | 'ANULADA'): Observable<AdminCampaignEntry[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AdminCampaignEntry[]>(`${this.base}/${id}/entries`, { params });
  }
}
