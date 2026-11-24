import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutService, MyBooking } from '../../services/checkout.service';
import { ClientPreferencesService } from '../../services/client-preferences.service';
import { MiAgendaComponent } from './mi-agenda.component';

function booking(code: string, startsAt: string, status = 'CONFIRMADA'): MyBooking {
  return {
    code, status, occurrenceStartsAt: startsAt, eventId: 1, eventTitle: code,
    quantity: 1, totalAmount: 50, currency: 'PEN', createdAt: '2026-11-01T00:00:00Z',
    modality: 'PRESENCIAL', locationName: null, cityName: 'Lima',
  };
}

describe('MiAgendaComponent', () => {
  afterEach(() => vi.useRealTimers());

  async function render(getMyBookings: CheckoutService['getMyBookings']) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-30T20:00:00Z'));
    await TestBed.configureTestingModule({
      imports: [MiAgendaComponent],
      providers: [
        provideRouter([]),
        { provide: CheckoutService, useValue: { getMyBookings } },
        { provide: ClientPreferencesService, useValue: { getPreferences: () => of({ interestCategories: [] }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MiAgendaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('ordena reservas confirmadas, agrupa por el día de Lima y enlaza la reserva concreta', async () => {
    const first = booking('PRIMERA', '2026-12-01T01:00:00Z');
    const second = booking('SEGUNDA', '2026-12-01T03:00:00Z', 'CONFIRMED');
    const fixture = await render(() => of([
      second, booking('OTRO-MES', '2026-12-01T05:00:00Z'), first,
      booking('PENDIENTE', '2026-12-01T00:00:00Z', 'PENDIENTE'),
    ]));

    const agenda = fixture.componentInstance;
    expect(agenda.proximaReserva()?.code).toBe('PRIMERA');
    expect(agenda.reservasEsteMes()).toBe(2);
    expect(fixture.nativeElement.querySelector('.featured-experience-card__actions a').getAttribute('href'))
      .toBe('/perfil?tab=reservas&reserva=PRIMERA');
    fixture.nativeElement.querySelector('.cal-d--highlight').click();
    fixture.detectChanges();
    expect(agenda.selectedDayBookings().map(item => item.code)).toEqual(['PRIMERA', 'SEGUNDA']);
    expect(fixture.nativeElement.querySelectorAll('.calendar-day-bookings a')).toHaveLength(2);
  });

  it('permite reintentar una carga fallida y muestra la agenda vacía cuando la API responde', async () => {
    const getMyBookings = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('sin conexión')))
      .mockReturnValue(of([]));
    const fixture = await render(getMyBookings);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.agenda-empty-title')?.textContent).toContain('Tu agenda está libre');
    expect(getMyBookings).toHaveBeenCalledTimes(2);
  });
});
