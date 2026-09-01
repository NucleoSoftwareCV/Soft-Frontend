import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';
import { FiltrosService } from '../../../services/filtros.service';

function flushCatalogRequests(httpMock: HttpTestingController): void {
  httpMock
    .match(req => req.url.endsWith('/categories') || req.url.endsWith('/experience-types') || req.url.endsWith('/cities'))
    .forEach(req => req.flush([]));
}

/** Espera el debounceTime(250) del contador en vivo. */
function waitForCountDebounce(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 320));
}

function flushEventCount(httpMock: HttpTestingController, totalElements: number): void {
  const req = httpMock.expectOne(r => r.url.endsWith('/events'));
  req.flush({
    content: [],
    totalElements,
    totalPages: 0,
    size: 1,
    number: 0,
  });
}

describe('HeaderComponent – filtro de precio y contador en vivo', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let httpMock: HttpTestingController;
  let filtrosService: FiltrosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    filtrosService = TestBed.inject(FiltrosService);

    fixture.detectChanges();
    flushCatalogRequests(httpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra la cantidad total de eventos al abrir el modal', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);

    expect(component.isFilterOpen()).toBe(true);
    expect(component.countLoading()).toBe(true);

    await waitForCountDebounce();
    flushEventCount(httpMock, 129);

    expect(component.resultCount()).toBe(129);
    expect(component.countLoading()).toBe(false);
    expect(component.applyButtonLabel()).toBe('Mostrar 129 resultados →');
  });

  it('aplica el filtro de precio automáticamente y actualiza la cantidad sin pulsar el botón', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    await waitForCountDebounce();
    const initial = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(initial.request.params.get('minPrice')).toBeNull();
    expect(initial.request.params.get('maxPrice')).toBeNull();
    initial.flush({ content: [], totalElements: 129, totalPages: 0, size: 1, number: 0 });

    component.pendingSelectPrice('15–30€');

    expect(filtrosService.filterPrice()).toBe('15–30€');
    expect(filtrosService.activeFilterCount).toBe(1);

    await waitForCountDebounce();
    const filtered = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(filtered.request.params.get('minPrice')).toBe('15');
    expect(filtered.request.params.get('maxPrice')).toBe('30');
    filtered.flush({ content: [], totalElements: 14, totalPages: 0, size: 1, number: 0 });

    expect(component.resultCount()).toBe(14);
    expect(component.applyButtonLabel()).toBe('Mostrar 14 resultados →');
  });

  it('clasifica la pill Gratis como rango [0, 0]', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    await waitForCountDebounce();
    httpMock.expectOne(r => r.url.endsWith('/events'))
      .flush({ content: [], totalElements: 129, totalPages: 0, size: 1, number: 0 });

    component.pendingSelectPrice('Gratis');
    await waitForCountDebounce();

    const req = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(req.request.params.get('minPrice')).toBe('0');
    expect(req.request.params.get('maxPrice')).toBe('0');
    req.flush({ content: [], totalElements: 3, totalPages: 0, size: 1, number: 0 });
  });

  it('deselecciona la pill al pulsarla de nuevo', () => {
    component.pendingSelectPrice('Más de 50€');
    expect(filtrosService.filterPrice()).toBe('Más de 50€');

    component.pendingSelectPrice('Más de 50€');
    expect(filtrosService.filterPrice()).toBeNull();
  });

  it('"Quitar filtros" limpia también el precio', async () => {
    filtrosService.filterPrice.set('Hasta 15€');
    component.openFilter();
    flushCatalogRequests(httpMock);
    await waitForCountDebounce();
    httpMock.expectOne(r => r.url.endsWith('/events'))
      .flush({ content: [], totalElements: 10, totalPages: 0, size: 1, number: 0 });

    component.pendingClearFilters();

    expect(component.pendingPrice()).toBeNull();
    expect(filtrosService.filterPrice()).toBeNull();
    expect(component.pendingFilterCount).toBe(0);
  });

  it('combina el filtro de precio con el resto de filtros en la misma petición', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    await waitForCountDebounce();
    httpMock.expectOne(r => r.url.endsWith('/events'))
      .flush({ content: [], totalElements: 129, totalPages: 0, size: 1, number: 0 });

    component.pendingSelectPrice('Más de 50€');
    component.pendingSelectModality('Online');
    await waitForCountDebounce();

    const req = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(req.request.params.get('minPrice')).toBe('50');
    expect(req.request.params.get('maxPrice')).toBeNull();
    expect(req.request.params.get('modality')).toBe('ONLINE');
    req.flush({ content: [], totalElements: 2, totalPages: 0, size: 1, number: 0 });
  });
});
