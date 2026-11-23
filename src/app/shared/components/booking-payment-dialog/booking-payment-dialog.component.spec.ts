import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CheckoutService, MyBooking } from '../../../services/checkout.service';
import { BookingPaymentDialogComponent } from './booking-payment-dialog.component';

describe('BookingPaymentDialogComponent', () => {
  const booking: MyBooking = {
    code: 'BKG-1', orderCode: 'ORD-1', status: 'ACEPTADA', quantity: 2, totalAmount: 50, currency: 'EUR',
    createdAt: '2026-11-01T10:00:00Z', eventId: 7, eventTitle: 'Yoga', occurrenceStartsAt: '2026-12-01T10:00:00Z',
    modality: 'ONLINE', locationName: null, cityName: null, paymentDeadline: '2026-11-20T10:00:00Z',
  };
  const processPayment = vi.fn();

  function render() {
    TestBed.configureTestingModule({
      imports: [BookingPaymentDialogComponent],
      providers: [{ provide: CheckoutService, useValue: { processPayment } }],
    });
    const fixture = TestBed.createComponent(BookingPaymentDialogComponent);
    fixture.componentRef.setInput('booking', booking);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => processPayment.mockReset());

  it('offers Visa and Yape and pays the order of the booking', () => {
    processPayment.mockReturnValue(of({ status: 'APROBADO', externalReference: 'TX', errorMessage: null, campaignEntries: [] }));
    const fixture = render();
    const paid = vi.fn();
    fixture.componentInstance.paid.subscribe(paid);
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('.payment-tabs button');
    expect(Array.from(tabs).map((t) => t.textContent)).toEqual(['Tarjeta Visa', 'Yape']);

    const component = fixture.componentInstance;
    component.onCardNumber('4111111111111111');
    component.onCardExpiration('1230');
    component.cardCvv = '123';
    component.cardHolderName = 'Ana';
    component.pay();
    fixture.detectChanges();

    expect(processPayment).toHaveBeenCalledWith('ORD-1', expect.objectContaining({ method: 'TARJETA', cardNumber: '4111111111111111', cardExpiration: '12/30' }));
    expect(paid).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('¡Tu reserva está confirmada!');
  });

  it('sends the Yape fields the backend expects', () => {
    processPayment.mockReturnValue(of({ status: 'APROBADO', externalReference: 'TX', errorMessage: null }));
    const component = render().componentInstance;
    component.method.set('YAPE');
    component.yapePhone = '987654321';
    component.yapeOtp = '123456';
    component.pay();
    expect(processPayment).toHaveBeenCalledWith('ORD-1', { method: 'YAPE', yapePhoneNumber: '987654321', yapeOtp: '123456' });
  });

  it('validates before calling the backend', () => {
    const component = render().componentInstance;
    component.pay();
    expect(component.error()).toContain('tarjeta');
    component.method.set('YAPE');
    component.pay();
    expect(component.error()).toContain('Yape');
    expect(processPayment).not.toHaveBeenCalled();
  });

  it('keeps the dialog open to retry after a declined or failed payment', () => {
    const fixture = render();
    const component = fixture.componentInstance;
    component.method.set('YAPE');
    component.yapePhone = '987654321';
    component.yapeOtp = '123456';

    processPayment.mockReturnValue(of({ status: 'RECHAZADO', externalReference: null, errorMessage: 'Fondos insuficientes' }));
    component.pay();
    expect(component.error()).toBe('Fondos insuficientes');
    expect(component.done()).toBe(false);

    processPayment.mockReturnValue(throwError(() => ({ error: { detail: 'El plazo de pago de la reserva ha vencido.' } })));
    component.pay();
    expect(component.error()).toContain('plazo de pago');
    expect(component.loading()).toBe(false);
  });
});
