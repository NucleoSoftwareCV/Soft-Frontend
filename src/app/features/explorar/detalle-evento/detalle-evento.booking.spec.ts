import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DetalleEvento } from './detalle-evento';
import { AuthService } from '../../../core/services/auth.service';
import { CheckoutService, MyBooking } from '../../../services/checkout.service';
import { EventosService } from '../../../services/eventos.service';
import { MyBookingsStore } from '../../../services/my-bookings.store';
import { NotificationsService } from '../../../services/notifications.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';

describe('DetalleEvento booking request', () => {
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  const occurrence = {
    id: 70, startsAt, endsAt: startsAt, status: 'PROGRAMADA', capacity: 10, reservedSpots: 0, availableSpots: 10, soldOut: false,
  };
  const event = {
    id: 7, title: 'Yoga', summary: 's', description: 'd', categoryName: 'Yoga', modality: 'PRESENCIAL', priceFrom: 20, currency: 'EUR',
    paymentMethod: 'WHATSAPP', organizer: { id: 3, publicName: 'Oona', whatsappPhone: '+34600111222' },
    occurrences: [occurrence], includes: [], highlights: [], whatToBring: [],
  };
  const emptyPage = { content: [], totalElements: 0, number: 0, size: 12 };
  const createOrder = vi.fn();
  const processPayment = vi.fn();
  const navigate = vi.fn();
  const active = signal<MyBooking[]>([]);
  const refresh = vi.fn();
  let component: DetalleEvento;
  let fixture: ComponentFixture<DetalleEvento>;

  beforeEach(async () => {
    createOrder.mockReset();
    processPayment.mockReset();
    navigate.mockClear();
    refresh.mockClear();
    active.set([]);
    await TestBed.configureTestingModule({
      imports: [DetalleEvento],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })), snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: EventosService, useValue: {
          getEvento: () => of(structuredClone(event)), getEventosSimilares: () => of(emptyPage),
          getOtrosEventosDelOrganizador: () => of(emptyPage), resolveAssetUrl: (url: string | null) => url,
        } },
        { provide: ProfessionalFollowService, useValue: { getStatus: () => of({ following: false }) } },
        { provide: AuthService, useValue: { isLoggedIn: true, roles: ['USER'], currentUser: signal({ username: 'ana', email: 'ana@x.es', roles: ['USER'] }) } },
        { provide: Router, useValue: { url: '/evento/7', navigate } },
        { provide: CheckoutService, useValue: { createOrder, processPayment } },
        { provide: MyBookingsStore, useValue: {
          refresh,
          forEvent: () => active(),
          forOccurrence: (id: number) => active().find((b) => b.occurrenceId === id) ?? null,
        } },
        { provide: NotificationsService, useValue: { refreshUnread: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DetalleEvento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function fillForm(): void {
    component.abrirReserva();
    component.compradorNombre.set('Ana');
    component.compradorApellido.set('López');
    component.compradorEmail.set('ana@x.es');
    component.compradorTelefono.set('+34600111222');
  }

  it('sends every event through the same request, without WhatsApp or payment', () => {
    createOrder.mockReturnValue(of({ code: 'ORD-1' }));
    fillForm();
    component.confirmarReserva();

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(processPayment).not.toHaveBeenCalled();
    expect(component.bookingStep()).toBe(3);
    expect(refresh).toHaveBeenCalled();
    expect(component.selectedOccurrence()?.availableSpots).toBe(9);
  });

  it('shows the duplicate error of the backend', () => {
    createOrder.mockReturnValue(throwError(() => ({ error: { detail: 'Ya tienes una reserva activa para esta fecha.' } })));
    fillForm();
    component.confirmarReserva();
    expect(component.bookingError()).toContain('reserva activa');
    expect(component.bookingStep()).toBe(1);
  });

  it('offers the request while there is no active booking on the date', () => {
    expect(component.bookingActionLabel()).toContain('Solicitar reserva');
    expect(component.bookingActionDisabled()).toBe(false);
  });

  it('goes to the payment of an accepted booking instead of a new request', () => {
    const booking = { code: 'BKG-1', status: 'ACEPTADA', occurrenceId: 70 } as MyBooking;
    active.set([booking]);
    expect(component.bookingActionLabel()).toBe('Completar pago');
    component.bookingAction();
    expect(component.paymentBooking()).toBe(booking);
    expect(component.showBookingModal()).toBe(false);
  });

  it('leads to the existing booking when it is pending or confirmed', () => {
    active.set([{ code: 'BKG-2', status: 'PENDIENTE', occurrenceId: 70 } as MyBooking]);
    expect(component.bookingActionLabel()).toBe('Ver mi reserva');
    component.bookingAction();
    expect(navigate).toHaveBeenCalledWith(['/perfil'], { queryParams: { tab: 'reservas', reserva: 'BKG-2' } });
  });
});
