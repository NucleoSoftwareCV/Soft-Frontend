import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { EventAttendeeRequest, EventAttendeeResponse, RegisterAttendanceRequest } from "../shared/models/event-attendance.model";

@Injectable({ providedIn: 'root' })
export class EventAttendeeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings/attendance`;

  getEventAttendee(request: EventAttendeeRequest): Observable<EventAttendeeResponse[]> {
    return this.http.post<EventAttendeeResponse[]>(this.base, request);
  }

  updateAttendanceStatus(request: RegisterAttendanceRequest): Observable<EventAttendeeResponse> {
    return this.http.patch<EventAttendeeResponse>(this.base, request);
  }
}
