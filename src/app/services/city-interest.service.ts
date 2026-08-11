import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface CityInterestRequest {
  cityId: number;
  email: string;
}

export interface CityInterestResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CityInterestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/city-interests`;

  registerInterest(request: CityInterestRequest): Observable<CityInterestResponse> {
    return this.http.post<CityInterestResponse>(this.base, request);
  }
}
