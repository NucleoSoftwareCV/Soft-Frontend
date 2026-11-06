import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CheckoutService, MyBooking } from '../../../services/checkout.service';
import { BookingCancellationNoticeComponent, CANCELLATION_CHECK_INTERVAL_MS } from './booking-cancellation-notice.component';

describe('BookingCancellationNoticeComponent', () => {
  const booking = (code: string, extra: Partial<MyBooking>): MyBooking => ({
    code, status: 'CANCELADA', quantity: 1, totalAmount: 50, currency: 'PEN', createdAt: '2026-10-01T10:00:00Z',
    eventId: 1, eventTitle: `Evento ${code}`, occurrenceStartsAt: '2026-11-02T17:00:00Z', modality: 'ONLINE',
    locationName: null, cityName: null, cancelledAt: new Date().toISOString(), ...extra,
  });
  const currentUser = signal<any>(null);
  let bookings: MyBooking[];
  const getMyBookings = vi.fn(() => of(bookings));

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    getMyBookings.mockClear();
    currentUser.set(null);
    bookings = [
      booking('REJ', { cancellationCause: 'RECHAZADA', cancellationReason: 'Sin cupo' }),
      booking('EXP', { cancellationCause: 'EXPIRADA', cancellationReason: 'Orden expirada sin pago' }),
      booking('OK', { status: 'CONFIRMADA' }),
      booking('OLD', { cancellationCause: 'RECHAZADA', cancelledAt: '2020-01-01T00:00:00Z' }),
    ];
    TestBed.configureTestingModule({
      imports: [BookingCancellationNoticeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
        { provide: CheckoutService, useValue: { getMyBookings } },
      ],
    });
  });
  afterEach(() => vi.useRealTimers());

  function render() {
    const fixture = TestBed.createComponent(BookingCancellationNoticeComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    return fixture;
  }

  it('does nothing for anonymous visitors', () => {
    const fixture = render();
    expect(getMyBookings).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('shows recent rejections and expirations with their reason', () => {
    currentUser.set({ id: 7, roles: ['USER'] });
    const fixture = render();
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('El profesional rechazó la reserva');
    expect(items[0].textContent).toContain('Sin cupo');
    expect(items[1].textContent).toContain('expiró');
  });

  it('does not show the same cancellation again once dismissed', () => {
    currentUser.set({ id: 7, roles: ['USER'] });
    const fixture = render();
    fixture.nativeElement.querySelector('.notice__button--primary').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();

    vi.advanceTimersByTime(CANCELLATION_CHECK_INTERVAL_MS);
    fixture.detectChanges();
    expect(getMyBookings).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('picks up a new cancellation on the next check', () => {
    currentUser.set({ id: 7, roles: ['USER'] });
    const fixture = render();
    fixture.nativeElement.querySelector('.notice__button--primary').click();
    bookings = [...bookings, booking('NEW', { cancellationCause: 'RECHAZADA', cancellationReason: 'Fecha cancelada' })];
    vi.advanceTimersByTime(CANCELLATION_CHECK_INTERVAL_MS);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Fecha cancelada');
  });
});
