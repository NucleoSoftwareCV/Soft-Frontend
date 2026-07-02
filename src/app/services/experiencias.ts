import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExperienciasService {
  private apiUrl = 'http://localhost:8083/api/v1/events';

  constructor(private http: HttpClient) {}

  getExperiencias(page = 0, size = 12) {
    return this.http.get<any>(this.apiUrl, {
      params: {
        page,
        size
      }
    });
  }

  getExperienciaById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}