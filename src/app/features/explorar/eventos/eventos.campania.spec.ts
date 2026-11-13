import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { Eventos } from './eventos';
import { EventsMapPanelComponent } from './events-map-panel.component';
import { AdvancedEventFiltersComponent } from './advanced-event-filters.component';
import { EventosService } from '../../../services/eventos.service';
import { CampaniasService } from '../../../services/campanias.service';
import { FiltrosService } from '../../../services/filtros.service';
import { CampaignSummary } from '../../../shared/models/campania.model';

@Component({ selector: 'app-events-map-panel', standalone: true, template: '' })
class TestPanel {
  embedded = input(false);
  filters = input({});
  categories = input<readonly unknown[]>([]);
  experienceTypes = input<readonly unknown[]>([]);
}

@Component({ selector: 'app-advanced-event-filters', standalone: true, template: '' })
class TestAdvancedFilters {}

const campaign: CampaignSummary = {
  slug: 'sorteo-bienestar',
  title: 'Sorteamos un año de bienestar gratis',
  subtitle: 'Sorteo · 600 € en crédito Oona',
  badgeLabel: 'Participa en el sorteo',
  heroImageUrl: null,
  prizeAmount: 600,
  prizeCurrency: 'EUR',
  participationStartsAt: '2026-10-23T12:00:00Z',
  participationEndsAt: '2026-10-31T22:59:00Z',
  drawAt: null,
  phase: 'ABIERTA',
};

describe('Explorar · filtro de sorteo', () => {
  const getEventos = vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 24 }));

  async function render(queryParams: Record<string, string>) {
    getEventos.mockClear();
    await TestBed.configureTestingModule({
      imports: [Eventos],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
        { provide: EventosService, useValue: {
          getCategorias: () => of([]),
          getExperienceTypes: () => of([]),
          getEventos,
        }},
        { provide: CampaniasService, useValue: { getActive: () => of([campaign]) } },
      ],
    }).overrideComponent(Eventos, {
      remove: { imports: [EventsMapPanelComponent, AdvancedEventFiltersComponent] },
      add: { imports: [TestPanel, TestAdvancedFilters] },
    }).compileComponents();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Eventos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, navigate };
  }

  it('lee ?campania= y pide solo los eventos participantes', async () => {
    const { element } = await render({ campania: 'sorteo-bienestar' });

    expect(getEventos).toHaveBeenLastCalledWith(expect.objectContaining({ campaignSlug: 'sorteo-bienestar' }));
    expect(element.querySelector('.campaign-chip')).toBeTruthy();
    expect(element.querySelector('.campaign-banner-btn.secondary')?.textContent).toContain('Ver todas');
  });

  it('el chip quita el filtro y actualiza la URL', async () => {
    const { fixture, element, navigate } = await render({ campania: 'sorteo-bienestar' });

    element.querySelector<HTMLButtonElement>('.campaign-chip')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getEventos).toHaveBeenLastCalledWith(expect.objectContaining({ campaignSlug: undefined }));
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { campania: null } }));
    expect(element.querySelector('.campaign-chip')).toBeNull();
  });

  it('sin filtro muestra el banner y permite activarlo', async () => {
    const { fixture, element } = await render({});

    expect(getEventos).toHaveBeenLastCalledWith(expect.objectContaining({ campaignSlug: undefined }));
    expect(element.querySelector('.campaign-banner strong')?.textContent).toContain(campaign.title);

    element.querySelector<HTMLButtonElement>('.campaign-banner-btn')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getEventos).toHaveBeenLastCalledWith(expect.objectContaining({ campaignSlug: 'sorteo-bienestar' }));
  });

  it('el filtro se combina con los demás criterios', async () => {
    const { fixture } = await render({ campania: 'sorteo-bienestar' });
    TestBed.inject(FiltrosService).filterCity.set('Valencia');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getEventos).toHaveBeenLastCalledWith(
      expect.objectContaining({ campaignSlug: 'sorteo-bienestar', cityName: 'Valencia' }),
    );
  });
});
