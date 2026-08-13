import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ClientOnboardingResponse,
  OnboardingPreferencesRequest,
  OnboardingStatus,
} from '../shared/models/onboarding.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/client-profiles/me/onboarding`;

  getState(): Observable<ClientOnboardingResponse> {
    return this.http.get<ClientOnboardingResponse>(this.base);
  }

  saveInterests(categoryIds: number[]): Observable<ClientOnboardingResponse> {
    return this.http.put<ClientOnboardingResponse>(`${this.base}/interests`, { categoryIds });
  }

  savePreferences(request: OnboardingPreferencesRequest): Observable<ClientOnboardingResponse> {
    return this.http.put<ClientOnboardingResponse>(`${this.base}/preferences`, request);
  }

  updateStatus(status: Extract<OnboardingStatus, 'COMPLETED' | 'SKIPPED'>): Observable<ClientOnboardingResponse> {
    return this.http.patch<ClientOnboardingResponse>(`${this.base}/status`, { status });
  }
}
