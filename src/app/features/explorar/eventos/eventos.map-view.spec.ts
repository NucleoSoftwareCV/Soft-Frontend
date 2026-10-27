import { AdvancedEventFiltersComponent } from './advanced-event-filters.component';
import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Eventos } from './eventos';
import { EventsMapPanelComponent } from './events-map-panel.component';
import { EventosService } from '../../../services/eventos.service';
import { FiltrosService } from '../../../services/filtros.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({ selector: 'app-events-map-panel', standalone: true, template: 'Mapa de prueba' })
class TestPanel {
  embedded = input(false);
  filters = input({});
  categories = input<readonly unknown[]>([]);
  experienceTypes = input<readonly unknown[]>([]);
}

@Component({ selector: 'app-advanced-event-filters', standalone: true, template: '' })
class TestAdvancedFilters {}

describe('Selector Cuadrícula / Mapa', () => {
  it('sustituye el listado por el mapa y permite regresar a la cuadrícula', async () => {
    await TestBed.configureTestingModule({
      imports: [Eventos],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: EventosService, useValue: {
          getCategorias: () => of([]),
          getExperienceTypes: () => of([]),
          getEventos: () => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 24 }),
        }},
        { provide: FiltrosService, useValue: {
          filterWhen: signal(null), filterCategories: signal([]), filterTypes: signal([]),
          filterCity: signal('Valencia'), filterTimeOfDay: signal(null), filterModality: signal(null),
          filterRecurrence: signal(null), filterPrice: signal(null), filterSpecialistId: signal(null), filterMood: signal<string | null>(null), activeFilterCount: 0,
          priceRangeFor: () => ({}),
        }},
        { provide: FavoritesService, useValue: { favoritedEventIds: signal(new Set<number>()) } },
        { provide: AuthService, useValue: { currentUser: signal(null), isLoggedIn: false } },
      ],
    }).overrideComponent(Eventos, {
      remove: { imports: [EventsMapPanelComponent, AdvancedEventFiltersComponent] },
      add: { imports: [TestPanel, TestAdvancedFilters] },
    }).compileComponents();
    const fixture = TestBed.createComponent(Eventos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.catalog-view-switch button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('app-events-map-panel')).toBeNull();
    expect(fixture.componentInstance.mapFilters().cityName).toBe('Valencia');
    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('app-events-map-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sort-btn').disabled).toBe(true);
    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-events-map-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sort-btn').disabled).toBe(false);
    expect(TestBed.inject(FiltrosService).filterCity()).toBe('Valencia');
  });
});
