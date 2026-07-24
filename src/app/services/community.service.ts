import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatchRequestUpsertRequest, MatchSubmissionResponse } from '../shared/models/match-bienestar.model';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/community`;

  upsertMatchRequest(request: MatchRequestUpsertRequest): Observable<MatchSubmissionResponse> {
    return this.http.put<MatchSubmissionResponse>(`${this.BASE}/match-request`, request);
  }
}
