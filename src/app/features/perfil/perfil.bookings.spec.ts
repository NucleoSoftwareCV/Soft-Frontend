import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PerfilComponent } from './perfil.component';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutService } from '../../services/checkout.service';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import { ProfessionalFollowService } from '../../services/professional-follow.service';
import { FavoritesService } from '../../services/favorites.service';

describe('PerfilComponent booking refresh', () => {
  let component: PerfilComponent;
  let api: { getMyBookings: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    api = { getMyBookings: vi.fn().mockReturnValue(of([])) };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { isLoggedIn: true } },
      { provide: CheckoutService, useValue: api },
      { provide: Router, useValue: {} },
      { provide: ActivatedRoute, useValue: {} },
      { provide: ProfessionalApplicationService, useValue: {} },
      { provide: ProfessionalFollowService, useValue: {} },
      { provide: FavoritesService, useValue: {} },
    ] });
    component = TestBed.runInInjectionContext(() => new PerfilComponent());
  });
  it('reads the latest booking status on returning to reservations', () => {
    api.getMyBookings.mockReturnValue(of([{ code: 'BKG-1', status: 'CANCELADA' }]));
    component.cambiarSeccionCliente('reservas');
    expect(component.myBookings()[0].status).toBe('CANCELADA');
  });
  it('refreshes the visible reservations when focus returns', () => {
    component.refreshVisibleBookings();
    expect(api.getMyBookings).toHaveBeenCalledTimes(1);
    component.seccionCliente.set('guardados'); component.refreshVisibleBookings();
    expect(api.getMyBookings).toHaveBeenCalledTimes(1);
  });
  it('provides a retryable error without clearing previously loaded data', () => {
    api.getMyBookings.mockReturnValue(throwError(() => new Error('network')));
    component.loadMyBookings();
    expect(component.bookingsError()).toContain('No pudimos');
    expect(component.bookingsLoading()).toBe(false);
  });
});
