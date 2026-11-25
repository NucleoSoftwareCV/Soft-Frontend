import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';

import { CheckoutService, MyBooking } from '../../services/checkout.service';
import { ClientPreferencesService } from '../../services/client-preferences.service';
import { ClientInterestCategoryResponse } from '../../shared/models/client-preferences.model';
import { getScheduledBookings } from '../../shared/utils/booking-schedule.util';
import { bookingStatusLabel } from '../../shared/utils/booking-status.util';

const LIMA_TIME_ZONE = 'America/Lima';
const calendarDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

function calendarDate(date: Date) {
  const parts = calendarDateFormat.formatToParts(date);
  return {
    year: Number(parts.find(part => part.type === 'year')?.value),
    month: Number(parts.find(part => part.type === 'month')?.value),
    day: Number(parts.find(part => part.type === 'day')?.value),
  };
}

@Component({
  selector: 'app-mi-agenda',
  imports: [RouterLink],
  templateUrl: './mi-agenda.component.html',
  styleUrl: './mi-agenda.component.css',
})
export class MiAgendaComponent implements OnInit {
  private readonly checkoutService = inject(CheckoutService);
  private readonly preferencesService = inject(ClientPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly myBookings = signal<MyBooking[]>([]);

  readonly bookingsLoading = signal(false);
  readonly bookingsError = signal<string | null>(null);
  readonly preferencias = signal<ClientInterestCategoryResponse[]>([]);
  readonly selectedDay = signal<number | null>(null);

  private readonly reservasProgramadas = computed(() => getScheduledBookings(this.myBookings()));
  readonly statusLabel = bookingStatusLabel;

  isAwaitingAction(booking: MyBooking): boolean {
    return booking.status === 'PENDIENTE' || booking.status === 'PENDING' || booking.status === 'ACEPTADA';
  }

  private readonly proximasReservas = computed(() => {
    const now = Date.now();
    return this.reservasProgramadas()
      .filter(({ date }) => date.getTime() > now)
      .map(({ booking }) => booking);
  });

  readonly proximaReserva = computed(() => this.proximasReservas()[0]);
  readonly siguientesReservas = computed(() => this.proximasReservas().slice(1, 4));

  private readonly today = new Date();
  private readonly todayInLima = calendarDate(this.today);
  readonly currentYear = this.todayInLima.year;
  readonly currentMonthName = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: LIMA_TIME_ZONE })
    .format(this.today);

  private readonly reservasPorDia = computed(() => {
    const bookingsByDay = new Map<number, MyBooking[]>();
    for (const { booking, date } of this.reservasProgramadas()) {
      const { year, month, day } = calendarDate(date);
      if (year !== this.currentYear || month !== this.todayInLima.month) continue;
      const bookings = bookingsByDay.get(day) ?? [];
      bookings.push(booking);
      bookingsByDay.set(day, bookings);
    }
    return bookingsByDay;
  });

  readonly reservasEsteMes = computed(() =>
    [...this.reservasPorDia().values()].reduce((total, bookings) => total + bookings.length, 0),
  );
  readonly selectedDayBookings = computed(() => this.reservasPorDia().get(this.selectedDay() ?? 0) ?? []);

  readonly calendarDays = computed(() => {
    const month = this.todayInLima.month;
    const firstWeekday = new Date(Date.UTC(this.currentYear, month - 1, 1)).getUTCDay();
    const padding = (firstWeekday + 6) % 7;
    const totalDays = new Date(Date.UTC(this.currentYear, month, 0)).getUTCDate();
    const bookingsByDay = this.reservasPorDia();

    const days = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      return {
        dayNumber,
        bookingCount: bookingsByDay.get(dayNumber)?.length ?? 0,
        isToday: dayNumber === this.todayInLima.day,
      };
    });

    return [...Array<null>(padding).fill(null), ...days];
  });

  private readonly dateTimeFormat = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  private readonly weekdayFormat = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short', timeZone: LIMA_TIME_ZONE,
  });
  private readonly hourFormat = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit', minute: '2-digit',
  });

  ngOnInit(): void {
    this.loadMyBookings();
    this.preferencesService.getPreferences()
      .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ interestCategories }) => this.preferencias.set(interestCategories));
  }

  loadMyBookings(): void {
    if (this.bookingsLoading()) return;

    this.bookingsLoading.set(true);
    this.bookingsError.set(null);
    this.checkoutService.getMyBookings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.bookingsLoading.set(false)),
      )
      .subscribe({
        next: (bookings) => this.myBookings.set(bookings),
        error: () => this.bookingsError.set('No pudimos cargar tu agenda.'),
      });
  }

  formatDateTime(date: string): string {
    const formatted = this.dateTimeFormat.format(new Date(date)).replace(',', ' •');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  getDayNumber(date: string): number {
    return calendarDate(new Date(date)).day;
  }

  getShortWeekday(date: string): string {
    return this.weekdayFormat.format(new Date(date)).toUpperCase().replace('.', '');
  }

  formatHourAndModality(booking: MyBooking): string {
    const time = this.hourFormat.format(new Date(booking.occurrenceStartsAt));
    const location = booking.modality === 'ONLINE' ? 'Online' : booking.cityName || 'Presencial';
    return `${time} · ${location}`;
  }
}
