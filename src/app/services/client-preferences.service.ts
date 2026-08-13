import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ClientProfilePreferencesRequest,
  ClientProfilePreferencesResponse,
} from '../shared/models/client-preferences.model';

@Injectable({ providedIn: 'root' })
export class ClientPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/client-profiles/me/preferences`;

  getPreferences(): Observable<ClientProfilePreferencesResponse> {
    return this.http.get<ClientProfilePreferencesResponse>(this.endpoint);
  }

  savePreferences(request: ClientProfilePreferencesRequest): Observable<ClientProfilePreferencesResponse> {
    return this.http.put<ClientProfilePreferencesResponse>(this.endpoint, request);
  }
}
