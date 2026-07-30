import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  PagedResponse,
  ProfessionalApplicationDecisionRequest,
  ProfessionalApplicationRequest,
  ProfessionalApplicationResponse,
  ProfessionalApplicationStatus,
} from '../shared/models/professional-application.model';

@Injectable({ providedIn: 'root' })
export class ProfessionalApplicationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/professional-applications`;
  private readonly adminBase = `${environment.apiUrl}/admin/professional-applications`;

  getMine(): Observable<ProfessionalApplicationResponse> {
    return this.http.get<ProfessionalApplicationResponse>(`${this.base}/me`);
  }

  saveMine(
    request: ProfessionalApplicationRequest
  ): Observable<ProfessionalApplicationResponse> {
    return this.http.put<ProfessionalApplicationResponse>(`${this.base}/me`, request);
  }

  getForAdmin(
    status: ProfessionalApplicationStatus | null,
    page = 0,
    size = 10
  ): Observable<PagedResponse<ProfessionalApplicationResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,DESC');
    if (status) params = params.set('status', status);

    return this.http.get<PagedResponse<ProfessionalApplicationResponse>>(
      this.adminBase,
      { params }
    );
  }

  decide(
    applicationId: number,
    request: ProfessionalApplicationDecisionRequest
  ): Observable<ProfessionalApplicationResponse> {
    return this.http.patch<ProfessionalApplicationResponse>(
      `${this.adminBase}/${applicationId}/decision`,
      request
    );
  }
}
