import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, ViewChild, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subscription, expand, reduce } from 'rxjs';
import { ProfessionalBookingsService } from '../../../services/professional-bookings.service';
import { EventManagementService } from '../../../services/event-management.service';
import { BOOKING_STATUS_LABELS, BookingStatus, ProfessionalBookingDetail, ProfessionalBookingPage } from '../../../shared/models/professional-booking.model';
import { EventManagementResponse, EventOccurrenceManagement } from '../../../shared/models/event-management.model';

@Component({
  selector: 'app-professional-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professional-reservations.component.html',
  styleUrl: './professional-reservations.component.css',
})
export class ProfessionalReservationsComponent {
  private readonly api = inject(ProfessionalBookingsService);
  private readonly eventsApi = inject(EventManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private optionsRequest?: Subscription;
  @ViewChild('detailDialog') dialog?: ElementRef<HTMLDialogElement>;
  readonly changed = output<void>();
  readonly page = signal<ProfessionalBookingPage | null>(null);
  readonly events = signal<EventManagementResponse[]>([]);
  readonly occurrences = signal<EventOccurrenceManagement[]>([]);
  readonly detail = signal<ProfessionalBookingDetail | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly optionsError = signal('');
  readonly detailError = signal('');
  readonly notice = signal('');
  readonly decision = signal<'CONFIRMADA' | 'CANCELADA' | null>(null);
  readonly statusLabels = BOOKING_STATUS_LABELS;
  readonly statuses: BookingStatus[] = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'LISTA_ESPERA', 'COMPLETADA', 'NO_ASISTIO'];
  status: BookingStatus | '' = '';
  eventId: number | null = null;
  occurrenceId: number | null = null;
  reason = '';

  constructor() {
    this.load();
    this.loadEventOptions();
  }

  loadEventOptions(): void {
    this.optionsRequest?.unsubscribe();
    this.optionsError.set('');
    this.optionsRequest = this.eventsApi.getMine(0, 100).pipe(
      expand(page => page.number + 1 >= page.totalPages ? EMPTY : this.eventsApi.getMine(page.number + 1, 100)),
      reduce((all, page) => all.concat(page.content), [] as EventManagementResponse[]),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: events => this.events.set(events),
      error: () => this.optionsError.set('No pudimos cargar el filtro de eventos.'),
    });
  }

  @HostListener('window:focus')
  onFocus(): void {
    if (!this.saving()) this.refresh();
  }

  load(number = 0): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.listRequest = this.api.list({
      page: number, size: 20, status: this.status || undefined,
      eventId: this.eventId ?? undefined, occurrenceId: this.occurrenceId ?? undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        if (page.number > 0 && page.content.length === 0 && page.number >= page.totalPages) {
          this.load(Math.max(0, page.totalPages - 1));
          return;
        }
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => { this.error.set('No pudimos cargar las reservas. Inténtalo otra vez.'); this.loading.set(false); },
    });
  }

  refresh(): void {
    this.load(this.page()?.number ?? 0);
    if (this.dialog?.nativeElement.open && this.detail()) this.readDetail(this.detail()!.booking.code);
  }

  setEvent(id: number | null): void {
    this.eventId = id;
    this.occurrenceId = null;
    this.occurrences.set(this.events().find(e => e.event.id === id)?.occurrences ?? []);
    this.load();
  }

  open(code: string): void {
    this.detail.set(null);
    this.decision.set(null);
    this.reason = '';
    if (!this.dialog?.nativeElement.open) this.dialog?.nativeElement.showModal();
    this.readDetail(code);
  }

  private readDetail(code: string): void {
    this.detailRequest?.unsubscribe();
    this.detailLoading.set(true);
    this.detailError.set('');
    this.detailRequest = this.api.detail(code).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: detail => { this.detail.set(detail); this.detailLoading.set(false); },
      error: () => { this.detailError.set('No pudimos consultar esta reserva. Cierra el detalle y vuelve a intentarlo.'); this.detailLoading.set(false); },
    });
  }

  close(event?: Event): void {
    if (this.saving()) { event?.preventDefault(); return; }
    this.dialog?.nativeElement.close();
    this.detailRequest?.unsubscribe();
    this.decision.set(null);
  }

  confirm(): void {
    const detail = this.detail();
    const decision = this.decision();
    if (!detail || !decision || this.saving() || detail.booking.status !== 'PENDIENTE') return;
    if (decision === 'CANCELADA' && (!this.reason.trim() || this.reason.trim().length > 255)) return;
    this.saving.set(true);
    this.detailError.set('');
    this.api.decide(detail.booking.code, decision, decision === 'CANCELADA' ? this.reason.trim() : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: updated => {
          this.detail.set(updated);
          this.decision.set(null);
          this.saving.set(false);
          this.notice.set(decision === 'CONFIRMADA' ? 'Reserva aceptada.' : 'Reserva rechazada. Las plazas se han liberado.');
          this.load(this.page()?.number ?? 0);
          this.readDetail(updated.booking.code);
          this.changed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          if (error.status === 409) {
            this.decision.set(null);
            this.notice.set('La reserva cambió o ya no admite esta acción. Actualizamos los datos.');
            this.refresh();
            this.changed.emit();
          } else {
            this.detailError.set(error.error?.detail ?? 'No pudimos guardar la decisión. Inténtalo otra vez.');
          }
        },
      });
  }
}
