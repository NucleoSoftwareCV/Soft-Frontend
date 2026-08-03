import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SpecialistProfileResponse {
  id: number;
  userId: number;
  slug: string;
  publicName: string;
  profileCategory: string;
  biography: string;
  description: string;
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
  socialLinks: ProfessionalSocialLinkResponse[];
  languages?: ProfessionalLanguageResponse[];
}

export interface ProfessionalSocialLinkResponse {
  id: number;
  platform: string;
  profileUrl: string;
}

export interface ProfessionalLanguageResponse {
  id: number;
  languageName: string;
}

export interface SpecialistProfileUpdateRequest {
  publicName?: string;
  profileCategory?: string;
  biography?: string;
  description?: string;
  whatsappPhone?: string;
  phoneNumber?: string;
  publicEmail?: string;
  website?: string;
  workTopicIds?: number[];
  techniqueIds?: number[];
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

  private readonly apiUrl = `${environment.apiUrl}/specialist-profiles`;

  resolveAssetUrl(url?: string): string | undefined {
    if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;
    if (!environment.apiUrl.startsWith('http')) return url;

    const apiOrigin = new URL(environment.apiUrl).origin;
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  getMine(): Observable<SpecialistProfileResponse> {
    return this.http.get<SpecialistProfileResponse>(`${this.apiUrl}/me`);
  }

  updateMine(request: SpecialistProfileUpdateRequest): Observable<SpecialistProfileResponse> {
    return this.http.patch<SpecialistProfileResponse>(`${this.apiUrl}/me`, request);
  }

  publishMine(): Observable<SpecialistProfileResponse> {
    return this.http.patch<SpecialistProfileResponse>(`${this.apiUrl}/me/publish`, {});
  }

  unpublishMine(): Observable<SpecialistProfileResponse> {
    return this.http.patch<SpecialistProfileResponse>(`${this.apiUrl}/me/unpublish`, {});
  }

  uploadPhoto(file: File): Observable<SpecialistProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpecialistProfileResponse>(`${this.apiUrl}/me/photo`, formData);
  }

  uploadBanner(file: File): Observable<SpecialistProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpecialistProfileResponse>(`${this.apiUrl}/me/banner`, formData);
  }

  saveSocialLink(platform: string, profileUrl: string): Observable<ProfessionalSocialLinkResponse> {
    return this.http.put<ProfessionalSocialLinkResponse>(`${this.apiUrl}/me/social-links`, {
      platform,
      profileUrl,
    });
  }

  deleteSocialLink(platform: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/social-links/${platform}`);
  }

  saveLanguage(languageName: string): Observable<ProfessionalLanguageResponse> {
    return this.http.post<ProfessionalLanguageResponse>(`${this.apiUrl}/me/languages`, {
      languageName,
    });
  }

  deleteLanguage(languageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/languages/${languageId}`);
  }

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
