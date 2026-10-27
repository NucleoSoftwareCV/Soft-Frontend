import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DetalleEvento } from './detalle-evento';
import { EventosService } from '../../../services/eventos.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CheckoutService } from '../../../services/checkout.service';
import { EventDetailResponse, EventModality, EventOccurrenceResponse } from '../../../shared/models/evento.model';

function session(id: number, city: string, latitude: number): EventOccurrenceResponse {
  return {
    id, startsAt: '2099-12-22T12:00:00Z', endsAt: '2099-12-22T13:00:00Z',
    capacity: 10, reservedSpots: 0, availableSpots: 10, soldOut: false, status: 'PROGRAMADA',
    location: { id, name: 'Centro ' + city, address: 'Dirección ' + city, cityName: city,
      latitude, longitude: 1, reference: '' },
  };
}

describe('Ubicación del detalle del evento', () => {
  let component: DetalleEvento;
  let event: EventDetailResponse;

  beforeEach(async () => {
    event = {
      id: 7, title: 'Yoga', summary: null, description: null, includes: [], highlights: [],
      whatToBring: [], modality: EventModality.PRESENCIAL, priceFrom: 10, currency: 'EUR',
      minimumAge: null, featured: false, categoryId: 1, categoryName: 'Yoga', organizer: null,
      occurrences: [session(11, 'Valencia', 39), session(12, 'Barcelona', 41)],
      experienceTypeId: null, eventType: null, experienceTypeSlug: null, isRecurring: true,
      createdAt: '', updatedAt: '', coverImageUrl: null, images: [],
    };
    await TestBed.configureTestingModule({
      imports: [DetalleEvento],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          paramMap: of(convertToParamMap({ id: '7' })),
          snapshot: { queryParamMap: convertToParamMap({ occurrenceId: '12' }) },
        }},
        { provide: EventosService, useValue: {
          getEvento: () => of(event),
          getEventosSimilares: () => of({ content: [] }),
          getOtrosEventosDelOrganizador: () => of({ content: [] }),
        }},
        { provide: ProfessionalFollowService, useValue: {} },
        { provide: AuthService, useValue: { isLoggedIn: false, currentUser: signal(null) } },
        { provide: FavoritesService, useValue: { favoritedEventIds: signal(new Set<number>()) } },
        { provide: CheckoutService, useValue: {} },
      ],
    }).overrideComponent(DetalleEvento, { set: { template: '', imports: [] } }).compileComponents();
    component = TestBed.createComponent(DetalleEvento).componentInstance;
  });

  it('conserva la sesión elegida al abrir el detalle desde un marcador', () => {
    expect(component.selectedOccurrence()?.id).toBe(12);
    expect(component.eventMapPoints()[0].cityName).toBe('Barcelona');
  });

  it('actualiza el mapa y la dirección al seleccionar otra sesión', () => {
    component.selectOccurrence(event.occurrences[0]);
    expect(component.eventMapPoints()[0].occurrenceId).toBe(11);
    expect(component.eventMapPoints()[0].latitude).toBe(39);
    expect(component.cityLabel()).toBe('Valencia');
  });

  it('no asigna un marcador físico a eventos online', () => {
    component.evento.set({ ...event, modality: EventModality.ONLINE });
    expect(component.eventMapPoints()).toEqual([]);
  });

  it('mantiene la dirección sin inventar coordenadas cuando faltan', () => {
    const occurrence = event.occurrences[1];
    component.selectOccurrence({
      ...occurrence,
      location: { ...occurrence.location!, latitude: null },
    });
    expect(component.eventMapPoints()).toEqual([]);
    expect(component.mapOccurrence()?.location?.address).toBe('Dirección Barcelona');
  });
});
