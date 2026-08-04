import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FiltrosService } from './filtros.service';

describe('FiltrosService', () => {
  let service: FiltrosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(FiltrosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the active categories and experience types returned by the API', () => {
    http.expectOne(request => request.url.endsWith('/categories')).flush([
      { id: 1, name: 'Yoga y Ballet', slug: 'yoga', emoji: '🧘', active: true, deletable: false },
      { id: 2, name: 'Oculta', slug: 'oculta', emoji: '✨', active: false, deletable: true },
    ]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([
      { id: 1, name: 'Talleres', slug: 'talleres', active: true, deletable: false },
    ]);

    expect(service.categoryOptions).toEqual(['Yoga y Ballet']);
    expect(service.typeOptions).toEqual(['Talleres']);
    expect(service.categories()[0].emoji).toBe('🧘');
  });

  it('removes a stale selected category after the catalog is refreshed', () => {
    http.expectOne(request => request.url.endsWith('/categories')).flush([
      { id: 1, name: 'Yoga', slug: 'yoga', emoji: '🧘', active: true, deletable: false },
    ]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([]);
    service.filterCategories.set(['Yoga']);

    service.refreshCatalogs();
    http.expectOne(request => request.url.endsWith('/categories')).flush([
      { id: 1, name: 'Yoga y Ballet', slug: 'yoga', emoji: '🧘', active: true, deletable: false },
    ]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([]);

    expect(service.filterCategories()).toEqual([]);
    expect(service.categoryOptions).toEqual(['Yoga y Ballet']);
  });
});
