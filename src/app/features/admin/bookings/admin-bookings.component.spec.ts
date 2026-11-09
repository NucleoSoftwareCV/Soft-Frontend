import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminBooking, AdminBookingsService } from '../../../services/admin-bookings.service';
import { AdminBookingsComponent } from './admin-bookings.component';

describe('AdminBookingsComponent', () => {
  const row = (code: string, extra: Partial<AdminBooking>): AdminBooking => ({
    code, orderCode: 'ORD-1', orderStatus: 'ABIERTA', customerName: 'Ana López', customerEmail: 'ana@x.es',
    professionalName: 'Ana Gómez', eventId: 1, eventTitle: 'Yoga', occurrenceStartsAt: '2026-12-01T10:00:00Z', quantity: 1,
    totalAmount: 20, currency: 'EUR', status: 'PENDIENTE', paymentDeadline: null, paymentMethod: null, paidAt: null,
    cancelledAt: null, cancellationCause: null, cancellationReason: null, createdAt: '2026-11-01T10:00:00Z', ...extra,
  });
  const list = vi.fn();

  function render() {
    TestBed.configureTestingModule({
      imports: [AdminBookingsComponent],
      providers: [{ provide: AdminBookingsService, useValue: { list } }],
    });
    const fixture = TestBed.createComponent(AdminBookingsComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => list.mockReset());

  it('shows payment and cancellation activity without management actions', () => {
    const content = [
      row('BKG-1', { status: 'CONFIRMADA', paymentMethod: 'YAPE', paidAt: '2026-11-02T10:00:00Z' }),
      row('BKG-2', { status: 'CANCELADA', cancellationCause: 'CLIENTE', cancellationReason: 'Cancelada por el cliente' }),
      row('BKG-3', { status: 'ACEPTADA', paymentDeadline: '2026-11-03T10:00:00Z' }),
    ];
    list.mockReturnValue(of({ content, totalElements: 3, totalPages: 1, size: 20, number: 0 }));
    const el = render().nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Pagada con Yape');
    expect(rows[1].textContent).toContain('Cancelada por el cliente');
    expect(rows[2].textContent).toContain('Pendiente de pago');
    expect(el.querySelector('tbody button')).toBeNull();
  });

  it('filters by status', () => {
    list.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 }));
    const fixture = render();
    fixture.componentInstance.status = 'ACEPTADA';
    fixture.componentInstance.load();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ACEPTADA', page: 0 }));
  });
});
