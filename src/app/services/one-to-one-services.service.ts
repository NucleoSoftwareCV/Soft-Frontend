import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  OneToOneServiceCardResponse,
  OneToOneServiceDetailResponse,
  OneToOneServicePageParams,
  SpringPage,
} from '../shared/models/one-to-one-service.model';

@Injectable({ providedIn: 'root' })
export class OneToOneServicesService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/one-to-one-services`;

  getPublicServices(params: OneToOneServicePageParams = {}): Observable<SpringPage<OneToOneServiceCardResponse>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<SpringPage<OneToOneServiceCardResponse>>(this.BASE, { params: httpParams });
  }

  getPublicService(id: number): Observable<OneToOneServiceDetailResponse> {
    return this.http.get<OneToOneServiceDetailResponse>(`${this.BASE}/${id}`);
  }
}
