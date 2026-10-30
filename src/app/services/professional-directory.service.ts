import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DirectoryProfile {
  id: number;
  slug: string;
  publicName: string;
  profileCategory: string;
  biography: string | null;
  photoUrl: string | null;
  specialties: string[];
  cityNames: string[];
  priceFrom: number | null;
  currency: string | null;
  nextStartsAt: string | null;
  cheapestServiceType: 'EVENT' | 'SESSION' | null;
  averageRating: number | null;
  reviewCount: number;
}

export interface DirectoryFeaturedService {
  id: number;
  type: 'EVENT' | 'SESSION';
  title: string;
  summary: string | null;
  imageUrl: string | null;
  specialistName: string;
  modality: string;
  category: string;
  price: number | null;
  currency: string | null;
  startsAt: string | null;
  acquisitionCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface ProfessionalDirectoryResponse {
  content: DirectoryProfile[];
  totalElements: number;
  number: number;
  size: number;
  specialties: string[];
  featured: DirectoryFeaturedService | null;
}

export type DirectoryType = 'professionals' | 'centers';

@Injectable({ providedIn: 'root' })
export class ProfessionalDirectoryService {
  private readonly http = inject(HttpClient);

  get(filters: { search: string; location: string; type: DirectoryType; specialty: string; page: number }) {
    const params = new HttpParams().set('search', filters.search).set('location', filters.location)
      .set('type', filters.type).set('specialty', filters.specialty).set('page', filters.page).set('size', 20);
    return this.http.get<ProfessionalDirectoryResponse>(
      `${environment.apiUrl}/specialist-profiles/directory`, { params });
  }
}
