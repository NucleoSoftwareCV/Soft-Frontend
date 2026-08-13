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
    http.expectOne(request => request.url.endsWith('/cities')).flush([
      { id: 1, name: 'Valencia', province: 'Valencia', countryCode: 'ES', active: true },
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
    http.expectOne(request => request.url.endsWith('/cities')).flush([]);
    service.filterCategories.set(['Yoga']);

    service.refreshCatalogs();
    http.expectOne(request => request.url.endsWith('/categories')).flush([
      { id: 1, name: 'Yoga y Ballet', slug: 'yoga', emoji: '🧘', active: true, deletable: false },
    ]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([]);
    http.expectOne(request => request.url.endsWith('/cities')).flush([]);

    expect(service.filterCategories()).toEqual([]);
    expect(service.categoryOptions).toEqual(['Yoga y Ballet']);
  });

  it('exposes cities from the API as filter options and clears a deactivated selection', () => {
    http.expectOne(request => request.url.endsWith('/categories')).flush([]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([]);
    http.expectOne(request => request.url.endsWith('/cities')).flush([
      { id: 1, name: 'Valencia', province: 'Valencia', countryCode: 'ES', active: true },
      { id: 2, name: 'Barcelona', province: 'Barcelona', countryCode: 'ES', active: true },
    ]);

    expect(service.cityOptions).toEqual(['Todas', 'Valencia', 'Barcelona']);
    expect(service.getCityByName('Valencia')?.id).toBe(1);

    service.filterCity.set('Barcelona');
    service.refreshCatalogs();
    http.expectOne(request => request.url.endsWith('/categories')).flush([]);
    http.expectOne(request => request.url.endsWith('/experience-types')).flush([]);
    http.expectOne(request => request.url.endsWith('/cities')).flush([
      { id: 1, name: 'Valencia', province: 'Valencia', countryCode: 'ES', active: true },
    ]);

    expect(service.filterCity()).toBe('Todas');
    expect(service.cityOptions).toEqual(['Todas', 'Valencia']);
  });
});
