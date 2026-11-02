import { TestBed } from '@angular/core/testing';

import { CampaniaBadgeComponent } from './campania-badge.component';

describe('CampaniaBadgeComponent', () => {
  function render(badges: { slug: string; label: string }[] | null | undefined, inline = false) {
    const fixture = TestBed.createComponent(CampaniaBadgeComponent);
    fixture.componentRef.setInput('badges', badges);
    fixture.componentRef.setInput('inline', inline);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el texto de la primera campaña', () => {
    const element = render([
      { slug: 'sorteo-bienestar', label: 'Participa en el sorteo' },
      { slug: 'otra', label: 'Otra campaña' },
    ]);

    const badge = element.querySelector('.campaign-badge');
    expect(badge?.textContent).toContain('Participa en el sorteo');
    expect(badge?.textContent).not.toContain('Otra campaña');
  });

  it('no pinta nada si el evento no participa', () => {
    expect(render([]).querySelector('.campaign-badge')).toBeNull();
    expect(render(undefined).querySelector('.campaign-badge')).toBeNull();
  });

  it('admite la variante en línea', () => {
    const badge = render([{ slug: 's', label: 'Sorteo' }], true).querySelector('.campaign-badge');
    expect(badge?.classList).toContain('inline');
  });
});
