import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SpecialistProfileResponse {
  id: number;
  userId: number;
  slug: string;
  publicName: string;
  profileCategory: string;
  biography: string;
  photoUrl?: string;
  bannerUrl?: string;
  whatsappPhone: string;
  phoneNumber?: string;
  publicEmail?: string;
  website?: string;
  approvalStatus: string;
  publicationStatus: string;
  approvedById?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  workTopics: string[];
  techniques: string[];
  socialLinks: any[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpecialistProfileService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8083/api/v1/specialist-profiles';

  getPublicProfiles(
    profileCategory?: string
  ): Observable<PageResponse<SpecialistProfileResponse>> {

    let params = new HttpParams();

    if (profileCategory) {
      params = params.set('profileCategory', profileCategory);
    }

    return this.http.get<PageResponse<SpecialistProfileResponse>>(
      this.apiUrl,
      { params }
    );
  }

  getPublicProfileBySlug(
    slug: string
  ): Observable<SpecialistProfileResponse> {

    return this.http.get<SpecialistProfileResponse>(
      `${this.apiUrl}/slug/${slug}`
    );
  }
}