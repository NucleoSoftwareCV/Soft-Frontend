import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventosService } from '../../../services/eventos.service';
import { EventOccurrenceCalendarResponse } from '../../models/evento.model';
import { resolveAssetUrl } from '../../utils/asset-url.util';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  occurrence?: EventOccurrenceCalendarResponse;
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

@Component({
  selector: 'app-evento-calendar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './evento-calendar.component.html',
  styleUrl: './evento-calendar.component.css',
})
export class EventoCalendarComponent implements OnInit {
  readonly specialistId = input.required<number>();
  readonly organizerName = input.required<string>();
  readonly organizerPhotoUrl = input<string | undefined>();

  private readonly eventosService = inject(EventosService);

  readonly weekdayLabels = WEEKDAY_LABELS;

  private readonly today = startOfDay(new Date());
  readonly viewDate = signal(startOfMonth(new Date()));
  readonly occurrences = signal<EventOccurrenceCalendarResponse[]>([]);

  readonly monthLabel = computed(() => {
    const date = this.viewDate();
    return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
  });

  readonly weeks = computed(() => {
    const days = this.buildDays(this.viewDate());
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  ngOnInit(): void {
    this.loadMonth();
  }

  previousMonth(): void {
    if (!this.isPrevEnabled()) return;
    this.viewDate.update(date => addMonths(date, -1));
    this.loadMonth();
  }

  nextMonth(): void {
    this.viewDate.update(date => addMonths(date, 1));
    this.loadMonth();
  }

  isPrevEnabled(): boolean {
    return this.viewDate() > startOfMonth(this.today);
  }

  assetUrl(url: string | null | undefined): string {
    return resolveAssetUrl(url);
  }

  private loadMonth(): void {
    const gridDays = this.buildDays(this.viewDate());
    const from = toIsoDate(gridDays[0].date);
    const to = toIsoDate(gridDays[gridDays.length - 1].date);

    this.eventosService.getPublicCalendar(this.specialistId(), from, to).subscribe({
      next: response => this.occurrences.set(response),
      error: error => console.error('Error al cargar el calendario de eventos:', error),
    });
  }

  private buildDays(viewDate: Date): CalendarDay[] {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const leadingOffset = (firstOfMonth.getDay() + 6) % 7;
    const totalCells = Math.ceil((leadingOffset + daysInMonth) / 7) * 7;

    const occurrenceByDay = new Map<string, EventOccurrenceCalendarResponse>();
    for (const occurrence of this.occurrences()) {
      const key = toIsoDate(new Date(occurrence.startsAt));
      if (!occurrenceByDay.has(key)) {
        occurrenceByDay.set(key, occurrence);
      }
    }

    const days: CalendarDay[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, 1 - leadingOffset + i);
      const key = toIsoDate(date);
      days.push({
        date,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === month,
        isToday: sameDay(date, this.today),
        occurrence: occurrenceByDay.get(key),
      });
    }

    return days;
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
