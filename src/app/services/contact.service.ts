import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactEmailRequest {
  nombre: string;
  email: string;
  profesional: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8083/api/contact';

  enviarEmail(
    data: ContactEmailRequest
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/email`,
      data
    );
  }
}