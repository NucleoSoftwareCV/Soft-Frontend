import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Directorio } from './directorio';
import { ProfessionalDirectoryService } from '../../../services/professional-directory.service';
import { SpecialistProfileService } from '../../../services/profesionales.service';

describe('Directorio de Joseph integrado con Perú', () => {
  const get = vi.fn();
  beforeEach(async () => {
    get.mockReset().mockReturnValue(of({
      content: [{ id: 7, slug: 'profesional-prueba', publicName: 'Profesional de prueba',
        profileCategory: 'PROFESIONAL', biography: 'Bienestar', photoUrl: null,
        specialties: ['Yoga'], cityNames: ['Lima'], priceFrom: 25, currency: 'PEN',
        nextStartsAt: '2026-11-10T15:00:00Z', cheapestServiceType: 'EVENT',
        averageRating: null, reviewCount: 0 }],
      totalElements: 1, number: 0, size: 20, specialties: ['Yoga'], featured: null,
    }));
    await TestBed.configureTestingModule({ imports: [Directorio], providers: [provideRouter([]),
      { provide: ProfessionalDirectoryService, useValue: { get } },
      { provide: SpecialistProfileService, useValue: { resolveAssetUrl: (url: string) => url } },
    ] }).compileComponents();
  });
  it('carga perfiles desde el servicio y conserva el acceso al perfil público', () => {
    const fixture = TestBed.createComponent(Directorio); fixture.detectChanges();
    expect(get).toHaveBeenCalledWith({ search: '', location: '', type: 'professionals', specialty: '', page: 0 });
    expect(fixture.nativeElement.textContent).toContain('Profesional de prueba');
    expect(fixture.nativeElement.querySelector('h3 a').getAttribute('href')).toBe('/profesionales/profesional-prueba');
  });
  it('presenta soles y horario peruano sin volver a etiquetas españolas', () => {
    const fixture = TestBed.createComponent(Directorio); fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('S/'); expect(text).toContain('hora de Perú');
    expect(text).not.toContain('hora de España'); expect(text).not.toContain('€');
    expect(fixture.componentInstance.date('2026-11-10T15:00:00Z')).toContain('10:00');
  });
  it('envía búsqueda, ciudad y especialidad y permite alternar centros', () => {
    const fixture = TestBed.createComponent(Directorio); fixture.detectChanges();
    const c = fixture.componentInstance;
    c.search = ' Yoga '; c.location = ' Lima '; c.buscar(); c.cambiarEspecialidad('Yoga');
    expect(get).toHaveBeenLastCalledWith({ search: 'Yoga', location: 'Lima', type: 'professionals', specialty: 'Yoga', page: 0 });
    c.cambiarTipo('centers');
    expect(get).toHaveBeenLastCalledWith({ search: 'Yoga', location: 'Lima', type: 'centers', specialty: '', page: 0 });
  });
});
