import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppointmentService, AvailabilityRule, AppointmentReceipt, appointmentDate, peruToday } from '../../../services/appointment.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { LocationResponse } from '../../../shared/models/evento.model';

type AgendaView = 'day' | 'week' | 'month' | 'pending';

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (value: string, days: number) => {
  const date = new Date(value + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
};
const localDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
});
const dayLabel = new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
const monthLabel = new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', month: 'long', year: 'numeric' });

@Component({ selector: 'app-professional-agenda', standalone: true, imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './professional-agenda.component.html', styleUrl: './professional-agenda.component.css' })
export class ProfessionalAgendaComponent implements OnInit {
  private readonly api = inject(AppointmentService);
  private readonly sessions = inject(OneToOneServicesService);
  private readonly destroyRef = inject(DestroyRef);
  readonly rules = signal<AvailabilityRule[]>([]);
  readonly appointmentToCancel = signal<AppointmentReceipt | null>(null);
  readonly appointments = signal<AppointmentReceipt[]>([]);
  readonly venues = signal<LocationResponse[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly formatDate = appointmentDate;
  readonly validToday = peruToday;
  day = 1; start = '09:00'; end = '12:00'; validFrom = peruToday(); validUntil = ''; locationId: number | null = null;
  readonly agendaDate = signal(peruToday());
  readonly view = signal<AgendaView>('pending');
  readonly views: { key: AgendaView; label: string }[] = [
    { key: 'pending', label: 'Pendientes' }, { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' },
  ];
  readonly statusFilter = signal('');
  readonly search = signal('');
  readonly statusLabels: Record<string, string> = {
    PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada',
    COMPLETADA: 'Completada', EXPIRADA: 'Vencida',
  };
  private agendaRequest?: Subscription;

  readonly period = computed(() => {
    const selected = this.agendaDate();
    const date = new Date(selected + 'T00:00:00Z');
    if (this.view() === 'week') {
      const from = addDays(selected, -((date.getUTCDay() + 6) % 7));
      return { from, to: addDays(from, 6) };
    }
    if (this.view() === 'month') {
      date.setUTCDate(1);
      const from = dateKey(date);
      date.setUTCMonth(date.getUTCMonth() + 1, 0);
      return { from, to: dateKey(date) };
    }
    return { from: selected, to: selected };
  });
  readonly periodLabel = computed(() => {
    if (this.view() === 'pending') return 'Solicitudes por responder';
    const { from, to } = this.period();
    if (this.view() === 'month') return monthLabel.format(new Date(from));
    return from === to ? dayLabel.format(new Date(from)) :
      dayLabel.format(new Date(from)) + ' – ' + dayLabel.format(new Date(to));
  });
  readonly totals = computed(() => ({
    all: this.appointments().length,
    pending: this.appointments().filter(item => item.status === 'PENDIENTE').length,
    confirmed: this.appointments().filter(item => item.status === 'CONFIRMADA').length,
  }));
  readonly visibleAppointments = computed(() => {
    const status = this.statusFilter();
    const search = this.search().trim().toLocaleLowerCase('es-PE');
    return this.appointments().filter(item => (!status || item.status === status) &&
      [item.title, item.customerName, item.code].some(value => value.toLocaleLowerCase('es-PE').includes(search)));
  });
  readonly calendar = computed(() => {
    const { from, to } = this.period();
    const days = [];
    const padding = (new Date(from).getUTCDay() + 6) % 7;
    const today = peruToday();
    const counts = new Map<string, number>();
    for (const item of this.visibleAppointments()) {
      const start = localDay.format(new Date(item.startsAt));
      const day = start < from ? from : start;
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    for (let date = from; date <= to; date = addDays(date, 1)) {
      days.push({ date, number: Number(date.slice(-2)), label: dayLabel.format(new Date(date)),
        today: date === today, count: counts.get(date) ?? 0 });
    }
    return { days, blanks: Array.from({ length: padding }) };
  });

  setView(view: AgendaView): void {
    if (this.view() === view) return;
    this.view.set(view);
    this.statusFilter.set('');
    this.loadAgenda();
  }

  selectDate(date: string, openDay = false): void {
    if (!date) return;
    this.agendaDate.set(date);
    if (openDay) this.view.set('day');
    this.loadAgenda();
  }

  move(direction: number): void {
    const current = this.agendaDate();
    if (this.view() === 'month') {
      const date = new Date(current + 'T00:00:00Z');
      date.setUTCMonth(date.getUTCMonth() + direction, 1);
      this.selectDate(dateKey(date));
      return;
    }
    this.selectDate(addDays(current, direction * (this.view() === 'week' ? 7 : 1)));
  }
  ngOnInit(): void {
    this.loadRules(); this.loadAgenda();
    this.sessions.getActiveLocations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: venues => this.venues.set(venues), error: () => this.error.set('No pudimos cargar las sedes. Recarga la página para reintentar.') });
  }
  loadRules(): void {
    this.api.rules().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: rules => this.rules.set(rules), error: err => this.error.set(err.error?.detail || 'No pudimos cargar la disponibilidad.') });
  }
  loadAgenda(): void {
    this.agendaRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.appointments.set([]);
    const { from, to } = this.period();
    const view = this.view();
    const request = view === 'pending' ? this.api.pending() :
      view === 'day' ? this.api.agenda(from) : this.api.agendaRange(from, to);
    this.agendaRequest = request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: items => { this.appointments.set(items); this.loading.set(false); },
      error: err => {
        this.error.set(err.error?.detail || 'No pudimos cargar la agenda.');
        this.loading.set(false);
      },
    });
  }
  saveRule(): void {
    if (this.saving()) return;
    this.saving.set(true); this.error.set(null); this.message.set(null);
    this.api.addRule({ dayOfWeek: Number(this.day), startTime: this.start, endTime: this.end, validFrom: this.validFrom, validUntil: this.validUntil || null, locationId: this.locationId })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.saving.set(false); this.message.set('Disponibilidad guardada.'); this.loadRules(); }, error: err => { this.saving.set(false); this.error.set(err.error?.detail || 'No pudimos guardar la franja.'); } });
  }
  removeRule(id: number): void {
    if (this.saving()) return; this.saving.set(true); this.error.set(null);
    this.api.removeRule(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.saving.set(false); this.loadRules(); }, error: err => { this.saving.set(false); this.error.set(err.error?.detail || 'No pudimos eliminar la franja.'); } });
  }
  decide(id: number, status: 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA', reason?: string): void {
    if (this.saving()) return; this.saving.set(true); this.error.set(null);
    this.api.decide(id, status, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.saving.set(false); this.message.set(status === 'CANCELADA' ? 'La cita se canceló y el horario quedó disponible.' : null); this.loadAgenda(); }, error: err => { this.saving.set(false); this.error.set(err.error?.detail || 'No pudimos actualizar la solicitud.'); } });
  }
  confirmCancellation(reason: string): void {
    const item = this.appointmentToCancel();
    if (!item || this.saving()) return;
    this.appointmentToCancel.set(null);
    this.decide(item.id, 'CANCELADA', reason);
  }

  cancellationActor(item: AppointmentReceipt): string {
    return item.cancelledBy === 'CLIENTE' ? 'Cancelada por el cliente' : 'Cancelada por el profesional';
  }

  canCancel(item: AppointmentReceipt): boolean {
    return Date.parse(item.startsAt) > Date.now();
  }

  canComplete(item: AppointmentReceipt): boolean { return item.status === 'CONFIRMADA' && new Date(item.endsAt).getTime() <= Date.now(); }
}
