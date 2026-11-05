import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateEventReviewRequest,
  EventReviewResponse,
  EventReviewPageResponse,
  EventRatingSummaryResponse,
  EventReviewEligibilityResponse,
} from '../shared/models/event-review.model';

@Injectable({ providedIn: 'root' })
export class EventReviewsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/events`;

  getSummary(eventId: number): Observable<EventRatingSummaryResponse> {
    return this.http.get<EventRatingSummaryResponse>(
      `${this.baseUrl}/${eventId}/reviews/summary`
    );
  }

  getEligibility(eventId: number): Observable<EventReviewEligibilityResponse> {
    return this.http.get<EventReviewEligibilityResponse>(
      `${this.baseUrl}/${eventId}/reviews/eligibility`
    );
  }

  createReview(eventId: number, request: CreateEventReviewRequest): Observable<EventReviewResponse> {
    return this.http.post<EventReviewResponse>(`${this.baseUrl}/${eventId}/reviews`, request);
  }
  getReviews(eventId: number, page = 0, size = 5): Observable<EventReviewPageResponse> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<EventReviewPageResponse>(`${this.baseUrl}/${eventId}/reviews`, { params });
  }
}
