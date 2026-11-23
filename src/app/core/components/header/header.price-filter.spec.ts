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

function flushEventCount(httpMock: HttpTestingController, totalElements: number) {
  const req = httpMock.expectOne(r => r.url.endsWith('/events'));
  req.flush({ content: [], totalElements, totalPages: 0, size: 1, number: 0 });
  return req;
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
    fixture.destroy();
    httpMock.verify({ ignoreCancelled: true });
  });

  async function openFilterAndCount(total: number): Promise<void> {
    component.openFilter();
    flushCatalogRequests(httpMock);
    fixture.detectChanges();
    await waitForCountDebounce();
    flushEventCount(httpMock, total);
  }

  it('muestra la cantidad total de eventos al abrir el panel', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    fixture.detectChanges();

    expect(component.isFilterOpen()).toBe(true);
    expect(component.applyButtonLabel()).toBe('Mostrar resultados');

    await waitForCountDebounce();
    const req = flushEventCount(httpMock, 129);

    expect(req.request.params.get('minPrice')).toBeNull();
    expect(req.request.params.get('maxPrice')).toBeNull();
    expect(component.pendingResultsCount()).toBe(129);
    expect(component.countLoading()).toBe(false);
    expect(component.applyButtonLabel()).toBe('Mostrar 129 experiencias');
  });

  it('recalcula la cantidad al elegir un precio y solo lo aplica al confirmar', async () => {
    await openFilterAndCount(129);

    component.pendingSelectPrice('15–30€');
    fixture.detectChanges();
    expect(filtrosService.filterPrice()).toBeNull();

    await waitForCountDebounce();
    const filtered = flushEventCount(httpMock, 14);
    expect(filtered.request.params.get('minPrice')).toBe('15');
    expect(filtered.request.params.get('maxPrice')).toBe('30');
    expect(component.applyButtonLabel()).toBe('Mostrar 14 experiencias');

    component.applyFilters();
    expect(filtrosService.filterPrice()).toBe('15–30€');
    expect(filtrosService.activeFilterCount).toBe(1);
    expect(component.isFilterOpen()).toBe(false);
  });

  it('clasifica la pill Gratis como rango [0, 0]', async () => {
    await openFilterAndCount(129);

    component.pendingSelectPrice('Gratis');
    fixture.detectChanges();
    await waitForCountDebounce();

    const req = flushEventCount(httpMock, 3);
    expect(req.request.params.get('minPrice')).toBe('0');
    expect(req.request.params.get('maxPrice')).toBe('0');
    expect(component.applyButtonLabel()).toBe('Mostrar 3 experiencias');
  });

  it('usa el singular cuando hay una sola experiencia', async () => {
    await openFilterAndCount(1);
    expect(component.applyButtonLabel()).toBe('Mostrar 1 experiencia');
  });

  it('deselecciona la pill al pulsarla de nuevo', () => {
    component.pendingSelectPrice('Más de 50€');
    expect(component.pendingPrice()).toBe('Más de 50€');

    component.pendingSelectPrice('Más de 50€');
    expect(component.pendingPrice()).toBeNull();
  });

  it('"Quitar filtros" limpia también el precio', async () => {
    filtrosService.filterPrice.set('Hasta 15€');
    await openFilterAndCount(10);
    expect(component.pendingPrice()).toBe('Hasta 15€');

    component.pendingClearFilters();

    expect(component.pendingPrice()).toBeNull();
    expect(component.pendingFilterCount).toBe(0);

    component.applyFilters();
    expect(filtrosService.filterPrice()).toBeNull();
  });

  it('combina el filtro de precio con el resto de filtros en la misma petición', async () => {
    await openFilterAndCount(129);

    component.pendingSelectPrice('Más de 50€');
    component.pendingSelectModality('Online');
    fixture.detectChanges();
    await waitForCountDebounce();

    const req = flushEventCount(httpMock, 2);
    expect(req.request.params.get('minPrice')).toBe('50');
    expect(req.request.params.get('maxPrice')).toBeNull();
    expect(req.request.params.get('modality')).toBe('ONLINE');
  });
});
