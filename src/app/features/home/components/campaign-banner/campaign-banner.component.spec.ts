import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CampaniasService } from '../../../../services/campanias.service';
import { CampaignSummary } from '../../../../shared/models/campania.model';
import { CAMPAIGN_ROTATION_MS, CampaignBannerComponent } from './campaign-banner.component';

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
    return fixture;
  }

  beforeEach(() => getActive.mockReset());
  afterEach(() => vi.useRealTimers());

  it('links to the open campaign and its eligible experiences', () => {
    getActive.mockReturnValue(of([campaign('sorteo-bienestar', 'ABIERTA'), campaign('proxima', 'PROXIMA')]));
    const el = render().nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('Campaña sorteo-bienestar');
    expect(el.querySelector('.campaign-home__btn')?.getAttribute('href')).toBe('/sorteo/sorteo-bienestar');
    expect(el.querySelector('.campaign-home__link')?.getAttribute('href')).toBe('/explorar?campania=sorteo-bienestar');
    expect(el.textContent).toContain('600');
  });

  it('announces an upcoming campaign without the experiences link or carousel controls', () => {
    getActive.mockReturnValue(of([campaign('proxima', 'PROXIMA')]));
    const el = render().nativeElement as HTMLElement;
    expect(el.textContent).toContain('Próximamente');
    expect(el.querySelector('.campaign-home__link')).toBeNull();
    expect(el.querySelector('.campaign-home__nav')).toBeNull();
  });

  it('renders nothing when there is no campaign or the request fails', () => {
    getActive.mockReturnValue(throwError(() => new Error('down')));
    expect((render().nativeElement as HTMLElement).querySelector('section')).toBeNull();
  });

  it('cycles through several campaigns with arrows, dots and rotation', () => {
    vi.useFakeTimers();
    getActive.mockReturnValue(of([campaign('a', 'ABIERTA'), campaign('b', 'ABIERTA'), campaign('c', 'PROXIMA')]));
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    const title = () => el.querySelector('h2')?.textContent ?? '';

    expect(el.querySelectorAll('.campaign-home__dot').length).toBe(3);
    expect(title()).toContain('Campaña a');

    el.querySelector<HTMLButtonElement>('[aria-label="Campaña siguiente"]')!.click();
    fixture.detectChanges();
    expect(title()).toContain('Campaña b');

    el.querySelector<HTMLButtonElement>('[aria-label="Campaña anterior"]')!.click();
    el.querySelector<HTMLButtonElement>('[aria-label="Campaña anterior"]')!.click();
    fixture.detectChanges();
    expect(title()).toContain('Campaña c');

    el.querySelectorAll<HTMLButtonElement>('.campaign-home__dot')[0].click();
    vi.advanceTimersByTime(CAMPAIGN_ROTATION_MS);
    fixture.detectChanges();
    expect(title()).toContain('Campaña b');
  });

  it('pauses the rotation while the visitor interacts', () => {
    vi.useFakeTimers();
    getActive.mockReturnValue(of([campaign('a', 'ABIERTA'), campaign('b', 'ABIERTA')]));
    const fixture = render();
    const section = (fixture.nativeElement as HTMLElement).querySelector('section')!;

    section.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(CAMPAIGN_ROTATION_MS * 2);
    fixture.detectChanges();
    expect(section.querySelector('h2')?.textContent).toContain('Campaña a');

    section.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(CAMPAIGN_ROTATION_MS);
    fixture.detectChanges();
    expect(section.querySelector('h2')?.textContent).toContain('Campaña b');
  });
});
