import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  FollowedProfessionalPageResponse,
  ProfessionalFollowStatusResponse,
} from '../shared/models/professional-follow.model';

@Injectable({ providedIn: 'root' })
export class ProfessionalFollowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/interactions/me/professional-follows`;

  follow(professionalId: number): Observable<ProfessionalFollowStatusResponse> {
    return this.http.put<ProfessionalFollowStatusResponse>(`${this.baseUrl}/${professionalId}`, {});
  }

  unfollow(professionalId: number): Observable<ProfessionalFollowStatusResponse> {
    return this.http.delete<ProfessionalFollowStatusResponse>(`${this.baseUrl}/${professionalId}`);
  }

  getStatus(professionalId: number): Observable<ProfessionalFollowStatusResponse> {
    return this.http.get<ProfessionalFollowStatusResponse>(`${this.baseUrl}/${professionalId}/status`);
  }

  getFollowedProfessionals(page = 0, size = 5): Observable<FollowedProfessionalPageResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'followedAt,desc');

    return this.http.get<FollowedProfessionalPageResponse>(this.baseUrl, { params });
  }
}
