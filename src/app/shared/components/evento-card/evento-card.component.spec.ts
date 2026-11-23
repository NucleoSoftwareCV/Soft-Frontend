import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EventoCardComponent } from './evento-card.component';
import { EventCardResponse, EventModality } from '../../models/evento.model';

const baseEvent: EventCardResponse = {
  id: 1,
  title: 'Yoga en el río',
  summary: null,
  modality: EventModality.PRESENCIAL,
  priceFrom: 8,
  currency: 'EUR',
  categoryId: 1,
  categoryName: 'Yoga',
  organizerId: 2,
  organizerName: 'Judith',
  organizerPhotoUrl: null,
  coverImageUrl: null,
  startsAt: '2026-10-31T09:00:00Z',
  endsAt: null,
  cityName: 'Valencia',
  experienceTypeId: null,
  eventType: null,
  experienceTypeSlug: null,
  isRecurring: false,
};

describe('EventoCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function render(evento: EventCardResponse): HTMLElement {
    const fixture = TestBed.createComponent(EventoCardComponent);
    fixture.componentRef.setInput('evento', evento);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el distintivo del sorteo en las experiencias incluidas', () => {
    const element = render({
      ...baseEvent,
      campaignBadges: [{ slug: 'sorteo-bienestar', label: 'Participa en el sorteo' }],
    });

    expect(element.querySelector('.campaign-badge')?.textContent).toContain('Participa en el sorteo');
  });

  it('no muestra el distintivo en el resto de experiencias', () => {
    expect(render(baseEvent).querySelector('.campaign-badge')).toBeNull();
    expect(render({ ...baseEvent, campaignBadges: [] }).querySelector('.campaign-badge')).toBeNull();
  });
});
