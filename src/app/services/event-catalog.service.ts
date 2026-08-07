import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CatalogUpsertRequest,
  CategoryCatalogItem,
  ExperienceTypeCatalogItem,
} from '../shared/models/event-catalog.model';

@Injectable({ providedIn: 'root' })
export class EventCatalogService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = `${environment.apiUrl}/categories`;
  private readonly experienceTypesUrl = `${environment.apiUrl}/experience-types`;

  getCategories(): Observable<CategoryCatalogItem[]> {
    return this.http.get<CategoryCatalogItem[]>(this.categoriesUrl);
  }

  getCategoriesForAdmin(): Observable<CategoryCatalogItem[]> {
    return this.http.get<CategoryCatalogItem[]>(`${this.categoriesUrl}/all`);
  }

  getExperienceTypes(): Observable<ExperienceTypeCatalogItem[]> {
    return this.http.get<ExperienceTypeCatalogItem[]>(this.experienceTypesUrl);
  }

  getExperienceTypesForAdmin(): Observable<ExperienceTypeCatalogItem[]> {
    return this.http.get<ExperienceTypeCatalogItem[]>(`${this.experienceTypesUrl}/all`);
  }

  createCategory(request: CatalogUpsertRequest): Observable<CategoryCatalogItem> {
    return this.http.post<CategoryCatalogItem>(this.categoriesUrl, request);
  }

  updateCategory(id: number, request: CatalogUpsertRequest): Observable<CategoryCatalogItem> {
    return this.http.put<CategoryCatalogItem>(`${this.categoriesUrl}/${id}`, request);
  }

  toggleCategory(id: number): Observable<CategoryCatalogItem> {
    return this.http.patch<CategoryCatalogItem>(`${this.categoriesUrl}/${id}/status`, {});
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  createExperienceType(request: CatalogUpsertRequest): Observable<ExperienceTypeCatalogItem> {
    return this.http.post<ExperienceTypeCatalogItem>(this.experienceTypesUrl, request);
  }

  updateExperienceType(id: number, request: CatalogUpsertRequest): Observable<ExperienceTypeCatalogItem> {
    return this.http.put<ExperienceTypeCatalogItem>(`${this.experienceTypesUrl}/${id}`, request);
  }

  toggleExperienceType(id: number): Observable<ExperienceTypeCatalogItem> {
    return this.http.patch<ExperienceTypeCatalogItem>(`${this.experienceTypesUrl}/${id}/status`, {});
  }

  deleteExperienceType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.experienceTypesUrl}/${id}`);
  }
}
