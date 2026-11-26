import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupportService, supportError } from './services/support.service';
import {
  CATEGORIES,
  STATUSES,
  PRIORITIES,
  SupportTicket,
  RefundRequest,
  Operation,
  SupportReference,
} from './models/support.model';
import { LucideArrowRight } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowRight],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">NUEVA SOLICITUD</span>
        <h1>Cuéntanos qué ocurrió</h1>
        <p>Incluye los detalles necesarios para que podamos ayudarte.</p>
      </div>
      <a routerLink="/soporte/tickets"
        >Mis solicitudes <svg lucideArrowRight aria-hidden="true"></svg
      ></a>
    </div>
    <p class="notice">
      Para una devolución, <a routerLink="/soporte/reembolsos/nuevo">solicita un reembolso</a>.
    </p>
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    <form class="panel form-panel" #form="ngForm" (ngSubmit)="submit()">
      <h2>Información del ticket</h2>
      <div class="form-grid">
        <label
          >Categoría<select name="category" [(ngModel)]="model.category" required>
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select></label
        ><label
          >Prioridad<select name="priority" [(ngModel)]="model.priority">
            @for (p of priorities; track p) {
              <option>{{ p }}</option>
            }
          </select></label
        >
      </div>
      <label
        >Asunto<input
          name="subject"
          [(ngModel)]="model.subject"
          required
          maxlength="150"
          placeholder="Resume el problema" /></label
      ><label
        >Descripción<textarea
          name="description"
          [(ngModel)]="model.description"
          required
          maxlength="10000"
          rows="7"
          placeholder="¿Qué pasó? ¿Cuándo ocurrió?"
        ></textarea>
      </label>
      <h2>Referencia relacionada <small>(opcional)</small></h2>
      <label
        >Servicio o reserva
        <select
          name="reference"
          [(ngModel)]="selectedReference"
          (ngModelChange)="selectReference()"
          [disabled]="referencesLoading()"
        >
          <option value="">
            {{ referencesLoading() ? 'Cargando tus reservas…' : 'Sin vincular una reserva' }}
          </option>
          <optgroup label="Eventos y experiencias">
            @for (ref of eventReferences(); track ref.key) {
              <option [value]="ref.key">
                {{ ref.title }} · {{ ref.startsAt | date: 'dd/MM/yyyy HH:mm' }} · {{ ref.status }} ·
                {{ ref.code }}
              </option>
            }
          </optgroup>
          <optgroup label="Sesiones individuales">
            @for (ref of sessionReferences(); track ref.key) {
              <option [value]="ref.key">
                {{ ref.title }} · {{ ref.startsAt | date: 'dd/MM/yyyy HH:mm' }} · {{ ref.status }} ·
                {{ ref.code }}
              </option>
            }
          </optgroup>
        </select>
      </label>
      @if (referencesError()) {
        <p class="alert" role="alert">{{ referencesError() }}</p>
        <button type="button" class="secondary" (click)="loadReferences()">
          Volver a cargar reservas
        </button>
      } @else if (!referencesLoading() && references().length === 0) {
        <p class="muted">
          Todavía no tienes reservas de eventos o sesiones. Puedes enviar tu consulta sin vincular
          una reserva.
        </p>
      }
      <label
        >Operación de pago (opcional)<select name="payment" [(ngModel)]="model.transactionId">
          <option [ngValue]="null">Sin vincular</option>
          @for (p of operations(); track p.id) {
            <option [ngValue]="p.id">
              {{ p.orderCode }} · {{ p.amount | number: '1.2-2' }} {{ p.currency }}
            </option>
          }
        </select></label
      >
      @if (operationsError()) {
        <p class="notice" role="status">{{ operationsError() }}</p>
      }
      <label
        >Referencia del Libro de Reclamaciones (opcional)<input
          name="complaintReference"
          [(ngModel)]="model.complaintReference"
          maxlength="100"
          placeholder="Código de una reclamación ya registrada"
      /></label>
      <p class="muted">
        Esta referencia permite seguimiento en soporte. El ticket no sustituye el registro formal en
        el Libro de Reclamaciones.
      </p>
      <label class="upload-area"
        >Adjuntar evidencia (PDF, PNG o JPG, hasta 5 MB)<input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          (change)="choose($event)"
      /></label>
      <p>Las evidencias solo son accesibles para ti y el personal autorizado.</p>
      <button type="submit" [disabled]="form.invalid || busy()">
        {{ busy() ? 'Registrando…' : 'Registrar solicitud' }}
      </button>
    </form>`,
  styleUrl: './support.css',
})
export class TicketFormComponent implements OnInit {
  private s = inject(SupportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  categories = CATEGORIES.filter((category) => category !== 'REEMBOLSOS');
  priorities = PRIORITIES;
  error = signal('');
  busy = signal(false);
  operations = signal<Operation[]>([]);
  references = signal<SupportReference[]>([]);
  referencesLoading = signal(false);
  referencesError = signal('');
  operationsError = signal('');
  selectedReference = '';
  eventReferences() {
    return this.references().filter((r) => r.kind === 'EVENT');
  }
  sessionReferences() {
    return this.references().filter((r) => r.kind === 'SESSION');
  }
  loadReferences() {
    this.referencesLoading.set(true);
    this.referencesError.set('');
    this.s.references().subscribe({
      next: (rows) => {
        this.references.set(rows);
        this.referencesLoading.set(false);
      },
      error: (e) => {
        this.referencesLoading.set(false);
        this.referencesError.set('No se pudieron cargar tus reservas. ' + supportError(e));
      },
    });
  }
  selectReference() {
    const ref = this.references().find((r) => r.key === this.selectedReference);
    this.model.bookingId = ref?.bookingId ?? null;
    this.model.sessionBookingId = ref?.sessionBookingId ?? null;
    this.model.eventId = ref?.eventId ?? null;
  }
  file: File | null = null;
  model = {
    category: 'OTROS',
    priority: 'MEDIA',
    subject: '',
    description: '',
    sessionBookingId: null as number | null,
    bookingId: null as number | null,
    eventId: null as number | null,
    transactionId: null as number | null,
    complaintReference: '',
  };
  ngOnInit() {
    const c = this.route.snapshot.queryParamMap.get('category');
    if (c === 'REEMBOLSOS') {
      void this.router.navigate(['/soporte/reembolsos/nuevo'], { replaceUrl: true });
      return;
    }
    const category = this.categories.find((value) => value === c);
    if (category) this.model.category = category;
    this.loadReferences();
    this.s.operations().subscribe({
      next: (d) => this.operations.set(d),
      error: () =>
        this.operationsError.set(
          'No se pudieron cargar los pagos. Puedes enviar el ticket sin vincular un pago.',
        ),
    });
  }
  choose(e: Event) {
    this.file = (e.target as HTMLInputElement).files?.[0] || null;
  }
  submit() {
    if (this.busy() || !this.model.subject.trim() || !this.model.description.trim()) return;
    if (this.file && this.file.size > 5 * 1024 * 1024) {
      this.error.set('El archivo supera los 5 MB');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.s.create(this.model).subscribe({
      next: (t) => {
        if (this.file)
          this.s.upload(t.id, this.file).subscribe({
            next: () => this.router.navigate(['/soporte/tickets', t.id]),
            error: (e) => {
              this.busy.set(false);
              this.router.navigate(['/soporte/tickets', t.id], {
                state: {
                  uploadError:
                    'El ticket fue creado, pero la evidencia no se adjuntó: ' + supportError(e),
                },
              });
            },
          });
        else this.router.navigate(['/soporte/tickets', t.id]);
      },
      error: (e) => {
        this.error.set(supportError(e));
        this.busy.set(false);
      },
    });
  }
}
