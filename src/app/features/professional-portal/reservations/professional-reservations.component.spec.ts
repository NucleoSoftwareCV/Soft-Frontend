import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProfessionalReservationsComponent } from './professional-reservations.component';
import { ProfessionalBookingsService } from '../../../services/professional-bookings.service';
import { EventManagementService } from '../../../services/event-management.service';
import { ProfessionalBookingDetail, ProfessionalBookingPage } from '../../../shared/models/professional-booking.model';

const pending: ProfessionalBookingDetail = {
  booking: { code: 'BKG-1', customerName: 'Cliente Uno', eventId: 1, eventTitle: 'Yoga',
    occurrenceId: 2, occurrenceStartsAt: '2027-01-01T12:00:00Z', quantity: 2,
    totalAmount: 50, currency: 'EUR', status: 'PENDIENTE', createdAt: '2026-10-26T12:00:00Z' },
  customerEmail: 'client@example.com', customerPhone: null, capacity: 10, reservedSpots: 2, availableSpots: 8,
  attendees: [], history: [],
};
const page: ProfessionalBookingPage = { content: [pending.booking], totalElements: 1, totalPages: 1, size: 20, number: 0, first: true, last: true };

describe('ProfessionalReservationsComponent', () => {
  let fixture: ComponentFixture<ProfessionalReservationsComponent>;
  let component: ProfessionalReservationsComponent;
  let api: { list: ReturnType<typeof vi.fn>; detail: ReturnType<typeof vi.fn>; decide: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    api = { list: vi.fn().mockReturnValue(of(page)), detail: vi.fn().mockReturnValue(of(pending)), decide: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ProfessionalReservationsComponent],
      providers: [
        { provide: ProfessionalBookingsService, useValue: api },
        { provide: EventManagementService, useValue: { getMine: () => of({ content: [], totalPages: 0, number: 0 }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfessionalReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
  });

  it('renders booking data and queries only the authenticated scope', () => {
    expect(fixture.nativeElement.textContent).toContain('BKG-1');
    expect(fixture.nativeElement.textContent).toContain('Cliente Uno');
    expect(api.list).toHaveBeenCalledWith({ page: 0, size: 20, status: undefined, eventId: undefined, occurrenceId: undefined });
  });
  it('filters by status and resets pagination', () => {
    component.status = 'CANCELADA';
    component.load();
    expect(api.list.mock.lastCall?.[0].status).toBe('CANCELADA');
    expect(api.list.mock.lastCall?.[0].page).toBe(0);
  });
  it('loads detail and displays pending actions', () => {
    component.open('BKG-1'); fixture.detectChanges();
    expect(api.detail).toHaveBeenCalledWith('BKG-1');
    expect(fixture.nativeElement.textContent).toContain('Aceptar reserva');
    expect(fixture.nativeElement.textContent).toContain('Rechazar solicitud');
  });
  it('never sends an empty rejection reason', () => {
    component.open('BKG-1'); component.decision.set('CANCELADA'); component.reason = '   '; component.confirm();
    expect(api.decide).not.toHaveBeenCalled();
  });
  it('prevents duplicate decisions while saving', () => {
    const response = new Subject<ProfessionalBookingDetail>();
    api.decide.mockReturnValue(response);
    component.open('BKG-1'); component.decision.set('CONFIRMADA');
    component.confirm(); component.confirm();
    expect(api.decide).toHaveBeenCalledTimes(1);
    expect(component.saving()).toBe(true);
  });
  it('refreshes list, detail and availability after a rejection', () => {
    const cancelled = { ...pending, booking: { ...pending.booking, status: 'CANCELADA' as const }, reservedSpots: 0, availableSpots: 10 };
    api.decide.mockReturnValue(of(cancelled));
    component.open('BKG-1');
    api.detail.mockReturnValue(of(cancelled));
    const changed = vi.fn(); component.changed.subscribe(changed);
    component.decision.set('CANCELADA'); component.reason = ' Sin disponibilidad '; component.confirm();
    expect(api.decide).toHaveBeenCalledWith('BKG-1', 'CANCELADA', 'Sin disponibilidad');
    expect(component.detail()?.availableSpots).toBe(10);
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it('reloads state on a concurrent conflict', () => {
    api.decide.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.open('BKG-1'); component.decision.set('CONFIRMADA'); component.confirm();
    expect(component.saving()).toBe(false);
    expect(component.decision()).toBe(null);
    expect(component.notice()).toContain('cambió');
    expect(api.detail).toHaveBeenCalledTimes(2);
  });
  it('hides decision actions for a confirmed booking', () => {
    api.detail.mockReturnValue(of({ ...pending, booking: { ...pending.booking, status: 'CONFIRMADA' } }));
    component.open('BKG-1'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Aceptar reserva');
  });
  it('shows empty and error states', () => {
    api.list.mockReturnValue(of({ ...page, content: [], totalElements: 0 }));
    component.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay reservas');
    api.list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
  it('refreshes on returning to the browser tab', () => {
    component.onFocus();
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
