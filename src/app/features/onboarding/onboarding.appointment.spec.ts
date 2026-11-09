import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { OnboardingComponent } from './onboarding.component';
import { OnboardingService } from '../../services/onboarding.service';
import { EventCatalogService } from '../../services/event-catalog.service';
import { CityService } from '../../services/city.service';
import { EventosService } from '../../services/eventos.service';
import { FavoritesService } from '../../services/favorites.service';
import { ToastService } from '../../shared/services/toast.service';

describe('Retorno desde la bienvenida a la cita iniciada', () => {
  const returnUrl = '/profesionales/ana-gomez?reservar=1#citas';
  const savePreferences = vi.fn(); const updateStatus = vi.fn();
  beforeEach(async () => {
    savePreferences.mockReturnValue(of({})); updateStatus.mockReturnValue(of({}));
    await TestBed.configureTestingModule({ imports: [OnboardingComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl }) } } },
      { provide: OnboardingService, useValue: { savePreferences, updateStatus } },
      { provide: EventCatalogService, useValue: {} }, { provide: CityService, useValue: {} },
      { provide: EventosService, useValue: {} }, { provide: FavoritesService, useValue: {} },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
    ] }).overrideComponent(OnboardingComponent, { set: { template: '' } }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });
  it('espera el guardado de preferencias antes de volver al profesional', () => {
    const saved = new Subject<unknown>(); savePreferences.mockReturnValue(saved);
    const c = TestBed.createComponent(OnboardingComponent).componentInstance; c.finish();
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
    saved.next({}); saved.complete();
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
  });
  it('vuelve al profesional si el usuario omite la personalización', () => {
    TestBed.createComponent(OnboardingComponent).componentInstance.skipOnboarding();
    expect(updateStatus).toHaveBeenCalledWith('SKIPPED');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
  });
  it('permanece en bienvenida y permite reintentar si no se guardan las preferencias', () => {
    const saved = new Subject<unknown>(); savePreferences.mockReturnValue(saved);
    const c = TestBed.createComponent(OnboardingComponent).componentInstance; c.finish(); saved.error(new Error('sin conexión'));
    expect(c.saving()).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
  });
});
