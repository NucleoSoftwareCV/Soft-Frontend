import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { EventosService } from '../../services/eventos.service';
import { EventTravelService } from '../../services/event-travel.service';
import { LocationNoticeComponent } from '../../shared/components/event-travel/event-travel.component';

describe('Aviso de ubicación en Inicio', () => {
  it('muestra un solo acceso a Preferencias y lo retira al disponer de ubicación', async () => {
    const location = signal<any>(null);
    const eligible = signal(true);
    await TestBed.configureTestingModule({
      imports: [HomeComponent], providers: [
        provideRouter([]),
        { provide: EventosService, useValue: { getHomeSections: () => of({ sections: [] }) } },
        { provide: EventTravelService, useValue: {
          eligible, location, loaded: signal(true), loadError: signal(false),
        } },
      ],
    }).overrideComponent(HomeComponent, {
      set: { imports: [LocationNoticeComponent], schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-location-notice')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.notice').textContent).toContain('Añade tu ubicación en Preferencias');
    expect(fixture.nativeElement.querySelector('.notice a').getAttribute('href')).toBe('/preferencias');
    location.set({ label: 'Mi referencia' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.notice')).toBeNull();
    location.set(null); eligible.set(false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.notice')).toBeNull();
  });
});
