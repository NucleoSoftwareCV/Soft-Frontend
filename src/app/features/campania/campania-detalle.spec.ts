import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CampaniaDetalleComponent } from './campania-detalle';
import { CampaniasService } from '../../services/campanias.service';
import { EventosService } from '../../services/eventos.service';
import { AuthService } from '../../core/services/auth.service';
import { CampaignDetail, CampaignPhase } from '../../shared/models/campania.model';

function detail(phase: CampaignPhase): CampaignDetail {
  return {
    summary: {
      slug: 'sorteo-bienestar',
      title: 'Sorteamos un año de bienestar gratis',
      subtitle: 'Sorteo · 600 € en crédito Oona',
      badgeLabel: 'Participa en el sorteo',
      heroImageUrl: null,
      prizeAmount: 600,
      prizeCurrency: 'EUR',
      participationStartsAt: '2026-10-23T12:00:00Z',
      participationEndsAt: '2026-10-31T22:59:00Z',
      drawAt: '2026-11-05T11:00:00Z',
      phase,
    },
    description: 'Reserva una experiencia elegible y participa.',
    prizeDescription: 'Crédito para 12 meses.',
    prizeActivationDeadline: '2026-12-05T11:00:00Z',
    participationConditions: 'Cada plaza confirmada es una participación.',
    legalTerms: 'Promoción organizada por Oona.',
    maxEntriesPerCustomer: null,
    faqs: [{ question: '¿Quién puede participar?', answer: 'Cualquier persona con cuenta.' }],
    eligibleEventCount: 1,
  };
}

describe('CampaniaDetalleComponent', () => {
  const campanias = {
    getBySlug: vi.fn(),
    getMyEntries: vi.fn(() => of({ campaignSlug: 'sorteo-bienestar', validTickets: 3, entries: [] })),
  };
  const eventos = {
    getEventos: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 })),
    resolveAssetUrl: vi.fn((url: string | null) => url),
  };
  let auth: { isLoggedIn: boolean; currentUser: ReturnType<typeof signal> };

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [CampaniaDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'sorteo-bienestar' })) } },
        { provide: CampaniasService, useValue: campanias },
        { provide: EventosService, useValue: eventos },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CampaniaDetalleComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    campanias.getBySlug.mockReset();
    campanias.getMyEntries.mockClear();
    eventos.getEventos.mockClear();
    auth = { isLoggedIn: false, currentUser: signal(null) };
  });

  it('muestra premio, fechas, FAQ y enlaza al catálogo filtrado', async () => {
    campanias.getBySlug.mockReturnValue(of(detail('ABIERTA')));

    const element = await render();

    expect(element.querySelector('h1')?.textContent).toContain('Sorteamos un año de bienestar gratis');
    expect(element.querySelector('.prize-amount')?.textContent?.replace(/\s/g, ' ')).toContain('600 €');
    expect(element.querySelectorAll('.dates-card li').length).toBe(4);
    expect(element.querySelector('.faq-list summary')?.textContent).toContain('¿Quién puede participar?');
    const cta = element.querySelector<HTMLAnchorElement>('.hero-actions a.btn-primary');
    expect(cta?.getAttribute('href')).toBe('/explorar?campania=sorteo-bienestar');
    expect(eventos.getEventos).toHaveBeenCalledWith(expect.objectContaining({ campaignSlug: 'sorteo-bienestar' }));
    expect(campanias.getMyEntries).not.toHaveBeenCalled();
  });

  it('muestra las participaciones del cliente autenticado', async () => {
    auth.isLoggedIn = true;
    campanias.getBySlug.mockReturnValue(of(detail('ABIERTA')));

    const element = await render();

    expect(element.querySelector('.my-entries')?.textContent).toContain('3');
  });

  it('sin campaña abierta no ofrece reservar ni carga experiencias', async () => {
    campanias.getBySlug.mockReturnValue(of(detail('CERRADA')));

    const element = await render();

    expect(element.querySelector('.hero-phase')?.textContent).toContain('terminó');
    expect(element.querySelector('.hero-actions a.btn-primary')).toBeNull();
    expect(element.querySelector('.final-cta')).toBeNull();
    expect(eventos.getEventos).not.toHaveBeenCalled();
  });

  it('informa cuando la campaña no existe', async () => {
    campanias.getBySlug.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const element = await render();

    expect(element.querySelector('.campania-state h1')?.textContent).toContain('no está disponible');
  });
});
