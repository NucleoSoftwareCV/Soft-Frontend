import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AdvancedEventFiltersComponent } from './advanced-event-filters.component';
import { FiltrosService } from '../../../services/filtros.service';
import { SpecialistProfileService } from '../../../services/profesionales.service';
import { EventModality } from '../../../shared/models/evento.model';

describe('Panel de filtros avanzados', () => {
  let fixture: ComponentFixture<AdvancedEventFiltersComponent>;
  let component: AdvancedEventFiltersComponent;
  let filters: FiltrosService;
  let http: HttpTestingController;
  const profiles = { getPublicProfiles: vi.fn(() => of({ content: [{ id: 9, publicName: 'Ana Gómez' }] })) };

  beforeEach(async () => {
    profiles.getPublicProfiles.mockClear();
    await TestBed.configureTestingModule({
      imports: [AdvancedEventFiltersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: SpecialistProfileService, useValue: profiles }],
    }).compileComponents();
    fixture = TestBed.createComponent(AdvancedEventFiltersComponent);
    component = fixture.componentInstance;
    filters = TestBed.inject(FiltrosService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(req => req.url.endsWith('/categories'))
      .flush([{ id: 1, name: 'Yoga', active: true }]);
    http.expectOne(req => req.url.endsWith('/experience-types'))
      .flush([{ id: 3, name: 'Talleres', active: true }]);
    http.expectOne(req => req.url.endsWith('/cities'))
      .flush([{ id: 1, name: 'Valencia', active: true }, { id: 2, name: 'Barcelona', active: true }]);
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => http.verify());

  it('mantiene los cambios pendientes hasta pulsar Aplicar y genera parámetros reales', () => {
    component.toggleCategory('Yoga');
    component.set('city', 'Barcelona');
    component.set('types', ['Talleres']);
    component.set('price', 'MAX:20');
    component.set('modality', 'Híbrida');
    expect(filters.filterCity()).toBe('Todas');
    expect(filters.filterCategories()).toEqual([]);
    component.apply();
    expect(filters.buildEventFilterParams(filters.snapshot())).toMatchObject({
      categoryIds: [1], experienceTypeId: 3, cityName: 'Barcelona', maxPrice: 20,
      modality: EventModality.HIBRIDA,
    });
  });

  it('limpia también profesional, precio y fechas aplicados', () => {
    component.set('price', 'MAX:0');
    component.chooseDate('Hoy');
    component.selectProfessional({ id: 9, publicName: 'Ana Gómez' });
    component.apply();
    expect(filters.filterSpecialistId()).toBe(9);
    expect(filters.priceRangeFor(filters.filterPrice())).toEqual({ maxPrice: 0 });
    component.clear();
    expect(filters.activeFilterCount).toBe(0);
    expect(filters.filterSpecialistId()).toBeNull();
    expect(component.professionalQuery()).toBe('');
  });

  it('impide aplicar fechas invertidas y nombres de profesional sin seleccionar', () => {
    component.chooseDate('CUSTOM');
    component.setDate('from', '2026-12-24');
    component.setDate('to', '2026-12-20');
    component.apply();
    expect(component.validationError()).toContain('fechas');
    expect(filters.filterWhen()).toBeNull();
    component.chooseDate('');
    component.onProfessionalInput('A');
    component.apply();
    expect(component.validationError()).toContain('Selecciona un profesional');
    expect(filters.filterSpecialistId()).toBeNull();
  });

  it('busca profesionales por nombre y aplica el ID seleccionado', async () => {
    component.onProfessionalInput('Ana');
    await vi.waitFor(() => expect(component.professionals()).toHaveLength(1));
    expect(profiles.getPublicProfiles).toHaveBeenCalledWith(undefined, 'Ana', 6);
    component.selectProfessional(component.professionals()[0]);
    component.apply();
    expect(filters.buildEventFilterParams(filters.snapshot()).specialistId).toBe(9);
  });

  it('sincroniza cambios aplicados desde los filtros del encabezado', async () => {
    filters.filterCity.set('Valencia');
    filters.filterPrice.set('MAX:35');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.draft().city).toBe('Valencia');
    expect(component.maxPrice()).toBe(35);
  });

  it('rechaza precios personalizados inválidos y conserva el cero', () => {
    expect(filters.priceRangeFor('MAX:0')).toEqual({ maxPrice: 0 });
    expect(filters.priceRangeFor('MAX:-1')).toEqual({});
    expect(filters.priceRangeFor('MAX:NaN')).toEqual({});
    expect(filters.priceRangeFor('MAX:')).toEqual({});
  });
  it('conserva y aplica estado de ánimo junto con profesional y precio', () => {
    component.set('mood', 'ENERGIA');
    component.set('price', 'MAX:0');
    component.selectProfessional({ id: 9, publicName: 'Ana Gómez' });
    component.apply();
    expect(filters.activeFilterCount).toBe(3);
    expect(filters.buildEventFilterParams(filters.snapshot())).toMatchObject({
      mood: 'ENERGIA', specialistId: 9, maxPrice: 0,
    });
    component.clear();
    expect(filters.filterMood()).toBeNull();
    expect(filters.activeFilterCount).toBe(0);
  });

  it('permite quitar desde el acceso rápido el estado elegido en el modal', () => {
    filters.filterMood.set('Energia');
    filters.selectMood('ENERGIA');
    expect(filters.filterMood()).toBeNull();
  });
});