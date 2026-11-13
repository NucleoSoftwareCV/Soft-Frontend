import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  AppointmentModality, AppointmentOptions, AppointmentReceipt, AppointmentService,
  AppointmentSlot, appointmentDate, peruToday,
} from '../../services/appointment.service';

@Component({
  selector: 'app-appointment-reschedule', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './appointment-reschedule.component.html', styleUrl: './appointment-reschedule.component.css',
})
export class AppointmentRescheduleComponent {
  readonly appointment = input.required<AppointmentReceipt>();
  readonly professionalMode = input(false);
  readonly closed = output<void>();
  readonly rescheduled = output<AppointmentReceipt>();
  private readonly api = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);
  private slotsRequest?: Subscription;
  readonly options = signal<AppointmentOptions | null>(null);
  readonly slots = signal<AppointmentSlot[]>([]);
  readonly selected = signal<AppointmentSlot | null>(null);
  readonly loading = signal(true);
  readonly loadingSlots = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formatDate = appointmentDate;
  readonly today = peruToday();
  modality: AppointmentModality = 'ONLINE';
  locationId: number | null = null;
  date = this.today;
  reason = '';

  constructor() {
    effect(onCleanup => {
      const appointment = this.appointment();
      this.loading.set(true); this.error.set(''); this.selected.set(null); this.slots.set([]);
      this.modality = appointment.modality;
      this.locationId = appointment.venue?.id ?? null;
      this.date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(new Date(appointment.startsAt));
      const request = this.api.options(appointment.serviceId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: options => { this.options.set(options); this.loading.set(false); this.loadSlots(); },
        error: err => { this.loading.set(false); this.error.set(err.error?.detail || 'No pudimos cargar las opciones de la cita.'); },
      });
      onCleanup(() => { request.unsubscribe(); this.slotsRequest?.unsubscribe(); });
    });
  }

  changeModality(modality: AppointmentModality): void {
    this.modality = modality;
    this.locationId = modality === 'PRESENCIAL' ? this.options()?.venues[0]?.id ?? null : null;
    this.loadSlots();
  }

  loadSlots(preserveError = false): void {
    this.slotsRequest?.unsubscribe();
    this.slots.set([]); this.selected.set(null);
    if (!preserveError) this.error.set('');
    const options = this.options();
    if (!options || !this.date || (this.modality === 'PRESENCIAL' && this.locationId === null)) return;
    this.loadingSlots.set(true);
    const availability = this.professionalMode()
      ? this.api.professionalRescheduleAvailability(this.appointment().id, this.date, this.modality, this.locationId)
      : this.api.availability(options.serviceId, this.date, this.modality, this.locationId);
    this.slotsRequest = availability
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: response => { this.slots.set(response.slots); this.loadingSlots.set(false); },
        error: err => { this.loadingSlots.set(false); this.error.set(err.error?.detail || 'No pudimos consultar los nuevos horarios.'); },
      });
  }

  submit(): void {
    const slot = this.selected();
    if (!slot || !this.reason.trim() || this.saving()) return;
    this.saving.set(true); this.error.set('');
    const input = {
      modality: this.modality, locationId: this.locationId, startsAt: slot.startsAt, reason: this.reason.trim(),
    };
    const request = this.professionalMode() ? this.api.proposeReschedule(this.appointment().id, input) :
      this.api.rescheduleMyAppointment(this.appointment().id, input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.saving.set(false); this.rescheduled.emit(result); },
      error: err => {
        this.saving.set(false); this.error.set(err.error?.detail || 'No pudimos reprogramar la cita.');
        if (err.status === 409) this.loadSlots(true);
      },
    });
  }

  time(value: string): string {
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }
}
