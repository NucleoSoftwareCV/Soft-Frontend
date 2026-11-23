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
import { MyBookingsStore } from '../../services/my-bookings.store';
import { NotificationsService } from '../../services/notifications.service';

describe('PerfilComponent booking refresh', () => {
  let component: PerfilComponent;
  let api: { getMyBookings: ReturnType<typeof vi.fn>; cancelMyBooking: ReturnType<typeof vi.fn> };
  const store = { refresh: vi.fn() };
  const notifications = { refreshUnread: vi.fn() };
  beforeEach(() => {
    api = { getMyBookings: vi.fn().mockReturnValue(of([])), cancelMyBooking: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { isLoggedIn: true } },
      { provide: CheckoutService, useValue: api },
      { provide: Router, useValue: {} },
      { provide: ActivatedRoute, useValue: {} },
      { provide: ProfessionalApplicationService, useValue: {} },
      { provide: ProfessionalFollowService, useValue: {} },
      { provide: FavoritesService, useValue: {} },
      { provide: MyBookingsStore, useValue: store },
      { provide: NotificationsService, useValue: notifications },
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
  it('only offers cancelling before the payment', () => {
    const booking = (status: string) => ({ code: 'BKG-1', status }) as never;
    expect(component.canCancel(booking('PENDIENTE'))).toBe(true);
    expect(component.canCancel(booking('ACEPTADA'))).toBe(true);
    expect(component.canCancel(booking('CONFIRMADA'))).toBe(false);
    expect(component.canCancel(booking('CANCELADA'))).toBe(false);
  });
  it('cancels a booking and refreshes everything that shows it', () => {
    component.cancellingBooking.set({ code: 'BKG-1', status: 'PENDIENTE' } as never);
    api.getMyBookings.mockClear();
    component.confirmCancelBooking();
    expect(api.cancelMyBooking).toHaveBeenCalledWith('BKG-1');
    expect(component.cancellingBooking()).toBeNull();
    expect(api.getMyBookings).toHaveBeenCalled();
    expect(store.refresh).toHaveBeenCalled();
    expect(notifications.refreshUnread).toHaveBeenCalled();
  });
  it('explains why a cancellation failed and reloads the real status', () => {
    api.cancelMyBooking.mockReturnValue(throwError(() => ({ error: { detail: 'Esta reserva ya no se puede cancelar.' } })));
    component.cancellingBooking.set({ code: 'BKG-1', status: 'ACEPTADA' } as never);
    api.getMyBookings.mockClear();
    component.confirmCancelBooking();
    expect(api.getMyBookings).toHaveBeenCalled();
    expect(component.cancelLoading()).toBe(false);
  });
  it('counts only the active bookings', () => {
    component.myBookings.set([{ status: 'ACEPTADA' }, { status: 'CANCELADA' }, { status: 'CONFIRMADA' }] as never);
    expect(component.activeBookingsCount()).toBe(2);
  });
});
