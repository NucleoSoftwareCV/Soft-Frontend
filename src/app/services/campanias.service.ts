import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CampaignDetail,
  CampaignMyEntries,
  CampaignSummary,
} from '../shared/models/campania.model';

@Injectable({ providedIn: 'root' })
export class CampaniasService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/campaigns`;

  /** Campañas publicadas que todavía no han cerrado (incluye las próximas). */
  getActive(): Observable<CampaignSummary[]> {
    return this.http.get<CampaignSummary[]>(`${this.BASE}/active`);
  }

  getBySlug(slug: string): Observable<CampaignDetail> {
    return this.http.get<CampaignDetail>(`${this.BASE}/${encodeURIComponent(slug)}`);
  }

  getMyEntries(slug: string): Observable<CampaignMyEntries> {
    return this.http.get<CampaignMyEntries>(`${this.BASE}/${encodeURIComponent(slug)}/entries/me`);
  }
}
