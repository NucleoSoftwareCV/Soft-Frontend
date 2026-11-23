import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { BookingIndicatorComponent } from '../shared/components/booking-indicator/booking-indicator.component';
import { bookingIndicator, bookingStatusLabel } from '../shared/utils/booking-status.util';
import { CheckoutService, MyBooking } from './checkout.service';
import { MyBookingsStore } from './my-bookings.store';

describe('MyBookingsStore', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const booking = (code: string, status: string, extra: Partial<MyBooking> = {}): MyBooking => ({
    code, status, quantity: 1, totalAmount: 20, currency: 'EUR', createdAt: future, eventId: 7, occurrenceId: 70,
    eventTitle: 'Yoga', occurrenceStartsAt: future, modality: 'ONLINE', locationName: null, cityName: null, ...extra,
  });
  const currentUser = signal<{ id: number; roles: string[] } | null>(null);
  const getMyBookings = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    getMyBookings.mockReset();
    currentUser.set(null);
    TestBed.configureTestingModule({
      imports: [BookingIndicatorComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: CheckoutService, useValue: { getMyBookings } },
      ],
    });
  });
  afterEach(() => vi.useRealTimers());

  function load(bookings: MyBooking[]) {
    getMyBookings.mockReturnValue(of(bookings));
    currentUser.set({ id: 1, roles: ['USER'] });
    const store = TestBed.inject(MyBookingsStore);
    TestBed.tick();
    vi.advanceTimersByTime(0);
    return store;
  }

  it('stays empty for visitors and professionals', () => {
    const store = TestBed.inject(MyBookingsStore);
    TestBed.tick();
    currentUser.set({ id: 1, roles: ['PROFESSIONAL'] });
    TestBed.tick();
    vi.advanceTimersByTime(0);
    expect(getMyBookings).not.toHaveBeenCalled();
    expect(store.active()).toEqual([]);
  });

  it('keeps only active bookings of future dates', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const store = load([
      booking('A', 'ACEPTADA'), booking('C', 'CANCELADA'), booking('P', 'CONFIRMADA', { occurrenceStartsAt: past, occurrenceId: 71 }),
    ]);
    expect(store.forEvent(7).map((b) => b.code)).toEqual(['A']);
    expect(store.forOccurrence(70)?.code).toBe('A');
    expect(store.forOccurrence(71)).toBeNull();
  });

  it('shows the indicator on cards and picks up changes on refresh', () => {
    const store = load([booking('P', 'PENDIENTE')]);
    const fixture = TestBed.createComponent(BookingIndicatorComponent);
    fixture.componentRef.setInput('eventId', 7);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ya tienes una solicitud de reserva pendiente');

    getMyBookings.mockReturnValue(of([booking('P', 'ACEPTADA')]));
    store.refresh();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu reserva fue aceptada. Completa tu pago');

    getMyBookings.mockReturnValue(of([booking('P', 'CANCELADA')]));
    store.refresh();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.booking-indicator')).toBeNull();
  });

  it('prioritises what needs an action and counts the seats', () => {
    expect(bookingIndicator([booking('C', 'CONFIRMADA'), booking('A', 'ACEPTADA')])?.status).toBe('ACEPTADA');
    expect(bookingIndicator([booking('C', 'CONFIRMADA', { quantity: 3 })])?.text).toBe('Ya tienes una reserva confirmada (3 plazas)');
    expect(bookingIndicator([])).toBeNull();
  });

  it('labels each status for the customer', () => {
    expect(bookingStatusLabel({ status: 'ACEPTADA' })).toBe('Aceptada, pendiente de pago');
    expect(bookingStatusLabel({ status: 'CANCELADA', cancellationCause: 'RECHAZADA' })).toBe('Rechazada');
    expect(bookingStatusLabel({ status: 'CANCELADA', cancellationCause: 'CLIENTE' })).toBe('Cancelada');
    expect(bookingStatusLabel({ status: 'CANCELADA', cancellationCause: 'EXPIRADA' })).toBe('Vencida');
  });
});
