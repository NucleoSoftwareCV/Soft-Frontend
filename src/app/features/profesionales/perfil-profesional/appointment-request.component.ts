import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AppointmentService, AppointmentOptions, AppointmentModality, AppointmentSlot, AppointmentReceipt, appointmentDate } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointment-request', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './appointment-request.component.html', styleUrl: './appointment-request.component.css',
})
export class AppointmentRequestComponent {
  readonly serviceId = input.required<number>();
  readonly busy = output<boolean>();
  private readonly api = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);
  private slotsSubscription?: Subscription;
  readonly options = signal<AppointmentOptions | null>(null);
  readonly slots = signal<AppointmentSlot[]>([]);
  readonly loading = signal(true);
  readonly loadingSlots = signal(false);
  readonly scheduleMessage = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly receipt = signal<AppointmentReceipt | null>(null);
  readonly saving = signal(false);
  readonly reviewing = signal(false);
  readonly selected = signal<AppointmentSlot | null>(null);
  modality: AppointmentModality = 'ONLINE';
  locationId: number | null = null;
  date = '';
  reason = '';
  readonly formatDate = appointmentDate;

  constructor() {
    effect(onCleanup => {
      const id = this.serviceId();
      this.slotsSubscription?.unsubscribe();
      this.options.set(null); this.slots.set([]); this.selected.set(null); this.receipt.set(null);
      this.reviewing.set(false); this.reason = ''; this.error.set(null); this.loading.set(true);
      const subscription = this.api.options(id).subscribe({
        next: options => {
          this.options.set(options);
          this.modality = options.modalities.find(mode => options.openings?.some(opening => mode === 'ONLINE' ? opening.locationId === null : opening.locationId !== null)) ?? options.modalities[0];
          this.locationId = this.modality === 'PRESENCIAL' ? options.venues[0]?.id ?? null : null;
          this.date = options.minDate; this.chooseConfiguredDate();
          this.loading.set(false); this.loadSlots();
        }, error: err => { this.loading.set(false); this.error.set(this.message(err, 'No pudimos cargar esta sesión. Vuelve a seleccionarla.')); },
      });
      onCleanup(() => { subscription.unsubscribe(); this.slotsSubscription?.unsubscribe(); });
    });
  }
  changeModality(value: AppointmentModality): void {
    this.modality = value; this.locationId = value === 'PRESENCIAL' ? this.options()?.venues[0]?.id ?? null : null;
    this.chooseConfiguredDate(); this.loadSlots();
  }
  changeVenue(value: number | null): void {
    this.locationId = value; this.chooseConfiguredDate(); this.loadSlots();
  }
  private matchingOpenings() {
    return this.options()?.openings?.filter(opening => opening.locationId === this.locationId) ?? [];
  }
  private chooseConfiguredDate(): void {
    const options = this.options();
    if (!options?.openings) return;
    const openings = this.matchingOpenings();
    for (let date = options.minDate; date <= options.maxDate; date = this.nextDate(date)) {
      const weekday = new Date(date + 'T12:00:00Z').getUTCDay() || 7;
      if (openings.some(opening => opening.dayOfWeek === weekday && opening.validFrom <= date && (!opening.validUntil || opening.validUntil >= date)
        && new Date(date + 'T' + opening.endTime + '-05:00').getTime() - options.durationMinutes * 60000 > Date.now())) {
        this.date = date; return;
      }
    }
  }
  private nextDate(date: string): string {
    const next = new Date(date + 'T12:00:00Z'); next.setUTCDate(next.getUTCDate() + 1); return next.toISOString().slice(0, 10);
  }
  scheduleSummary(): string {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return [...new Set(this.matchingOpenings().map(opening => `${days[opening.dayOfWeek - 1]} ${opening.startTime.slice(0, 5)}–${opening.endTime.slice(0, 5)}`))].join(' · ');
  }
  loadSlots(preserveError = false): void {
    this.slotsSubscription?.unsubscribe();
    this.selected.set(null); this.slots.set([]); this.reviewing.set(false); this.loadingSlots.set(false);
    if (!preserveError) this.error.set(null);
    this.scheduleMessage.set(null);
    const options = this.options();
    if (options?.openings && !this.matchingOpenings().length) {
      this.scheduleMessage.set('El profesional aún no tiene horarios configurados para esta modalidad y sede.'); return;
    }
    if (!options || !this.date || (this.modality === 'PRESENCIAL' && this.locationId === null)) return;
    if (this.date < options.minDate || this.date > options.maxDate) { this.error.set('Elige una fecha dentro del intervalo disponible.'); return; }
    this.loadingSlots.set(true);
    this.slotsSubscription = this.api.availability(options.serviceId, this.date, this.modality, this.locationId).subscribe({
      next: result => { this.slots.set(result.slots); this.loadingSlots.set(false); },
      error: err => { this.loadingSlots.set(false); this.error.set(this.message(err, 'No pudimos consultar los horarios. Inténtalo de nuevo.')); },
    });
  }
  review(): void {
    if (this.saving() || !this.selected() || !this.reason.trim() || this.reason.length > 2000) return;
    this.reviewing.set(true); this.error.set(null);
  }
  submit(): void {
    const options = this.options(); const slot = this.selected();
    if (!this.reviewing() || this.saving() || this.receipt() || !options || !slot || !this.reason.trim() || this.reason.length > 2000) return;
    this.saving.set(true); this.busy.emit(true); this.error.set(null);
    this.api.request({ serviceId: options.serviceId, modality: this.modality, locationId: this.locationId, startsAt: slot.startsAt, reason: this.reason.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => { this.receipt.set(result); this.saving.set(false); this.busy.emit(false); },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false); this.busy.emit(false);
          this.error.set(this.message(err, 'No pudimos confirmar el envío. Consulta con el profesional antes de repetirlo.'));
          if (err.status === 409) this.loadSlots(true);
        },
      });
  }
  time(value: string): string { return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  private message(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 401) return 'Tu sesión ha caducado. Inicia sesión de nuevo para continuar.';
    if (err.status === 403) return 'Accede con una cuenta de usuario para solicitar la cita.';
    return err.error?.detail || fallback;
  }
}
