import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CreateEventRequest,
  CreateEventResponse,
  EventManagementPage,
  EventManagementResponse,
  EventOccurrenceManagement,
  EventOccurrenceRequest,
  EventOccurrenceStatus,
  EventStatus,
  EventUpsertRequest,
} from '../shared/models/event-management.model';

export interface OccurrenceAttendee {
  attendeeId: number;
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  attendanceStatus: string;
  bookingCode: string;
  bookingStatus: string;
  bookingCreatedAt: string;
  buyerFullName: string;
  buyerEmail: string;
  buyerPhone: string | null;
}

@Injectable({ providedIn: 'root' })
export class EventManagementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/events`;
  private readonly occurrencesBase = `${environment.apiUrl}/event-occurrences`;

  getMine(page = 0, size = 12): Observable<EventManagementPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'updatedAt,DESC');
    return this.http.get<EventManagementPage>(`${this.base}/my-events`, { params });
  }

  getManagement(id: number): Observable<EventManagementResponse> {
    return this.http.get<EventManagementResponse>(`${this.base}/${id}/management`);
  }

  create(request: CreateEventRequest): Observable<CreateEventResponse> {
    return this.http.post<CreateEventResponse>(this.base, request);
  }

  update(id: number, request: EventUpsertRequest): Observable<EventManagementResponse> {
    return this.http.put<EventManagementResponse>(`${this.base}/${id}`, request);
  }

  updateStatus(id: number, status: EventStatus): Observable<EventManagementResponse> {
    return this.http.patch<EventManagementResponse>(`${this.base}/${id}/status`, { status });
  }

  addImage(id: number, file: File): Observable<EventManagementResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventManagementResponse>(`${this.base}/${id}/images`, formData);
  }

  deleteImage(id: number, imageId: number): Observable<EventManagementResponse> {
    return this.http.delete<EventManagementResponse>(`${this.base}/${id}/images/${imageId}`);
  }

  addOccurrence(eventId: number, request: EventOccurrenceRequest): Observable<EventOccurrenceManagement> {
    return this.http.post<EventOccurrenceManagement>(`${this.base}/${eventId}/occurrences`, request);
  }

  updateOccurrence(id: number, request: EventOccurrenceRequest): Observable<EventOccurrenceManagement> {
    return this.http.put<EventOccurrenceManagement>(`${this.occurrencesBase}/${id}`, request);
  }

  updateOccurrenceStatus(id: number, status: EventOccurrenceStatus): Observable<EventOccurrenceManagement> {
    return this.http.patch<EventOccurrenceManagement>(
      `${this.occurrencesBase}/${id}/status`,
      { status }
    );
  }

  getOccurrenceAttendees(occurrenceId: number): Observable<OccurrenceAttendee[]> {
    return this.http.get<OccurrenceAttendee[]>(`${this.base}/occurrences/${occurrenceId}/attendees`);
  }
}
