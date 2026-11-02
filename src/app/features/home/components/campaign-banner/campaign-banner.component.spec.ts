import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CampaniasService } from '../../../../services/campanias.service';
import { CampaignSummary } from '../../../../shared/models/campania.model';
import { CampaignBannerComponent } from './campaign-banner.component';

describe('CampaignBannerComponent', () => {
  const campaign = (slug: string, phase: CampaignSummary['phase']): CampaignSummary => ({
    slug, phase, title: `Campaña ${slug}`, subtitle: null, badgeLabel: 'Participa en el sorteo',
    heroImageUrl: null, prizeAmount: 600, prizeCurrency: 'EUR',
    participationStartsAt: '2026-10-01T00:00:00Z', participationEndsAt: '2026-11-12T22:59:00Z', drawAt: null,
  });
  const getActive = vi.fn();

  function render() {
    TestBed.configureTestingModule({
      imports: [CampaignBannerComponent],
      providers: [provideRouter([]), { provide: CampaniasService, useValue: { getActive } }],
    });
    const fixture = TestBed.createComponent(CampaignBannerComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => getActive.mockReset());

  it('links to the open campaign and its eligible experiences', () => {
    getActive.mockReturnValue(of([campaign('proxima', 'PROXIMA'), campaign('sorteo-bienestar', 'ABIERTA')]));
    const el = render();
    expect(el.querySelector('h2')?.textContent).toContain('Campaña sorteo-bienestar');
    expect(el.querySelector('.campaign-home__btn')?.getAttribute('href')).toBe('/sorteo/sorteo-bienestar');
    expect(el.querySelector('.campaign-home__link')?.getAttribute('href')).toBe('/explorar?campania=sorteo-bienestar');
    expect(el.textContent).toContain('600');
  });

  it('announces an upcoming campaign without the experiences link', () => {
    getActive.mockReturnValue(of([campaign('proxima', 'PROXIMA')]));
    const el = render();
    expect(el.textContent).toContain('Próximamente');
    expect(el.querySelector('.campaign-home__link')).toBeNull();
  });

  it('renders nothing when there is no campaign or the request fails', () => {
    getActive.mockReturnValue(throwError(() => new Error('down')));
    expect(render().querySelector('section')).toBeNull();
  });
});
