import { finalize } from 'rxjs';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupportService, supportError } from './services/support.service';
import {
  REFUND_REASONS,
  STATUSES,
  PRIORITIES,
  SupportTicket,
  RefundRequest,
  Operation,
} from './models/support.model';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowLeft],
  template: `<a class="back-link" routerLink="/soporte/reembolsos"
      ><svg lucideArrowLeft aria-hidden="true"></svg> Mis reembolsos</a
    >
    <div class="page-heading">
      <div>
        <span class="eyebrow">DEVOLUCIONES</span>
        <h1>Solicitar un reembolso</h1>
        @if (ticketId) {
          <p>La solicitud quedará vinculada a tu ticket existente.</p>
        }
        <p>La solicitud será evaluada según las condiciones comerciales de Oona.</p>
      </div>
    </div>
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    @if (operationsLoading()) {
      <p role="status">Buscando pagos disponibles…</p>
    } @else if (!error() && !operations().length) {
      <p class="notice" role="status">
        Esta cuenta no tiene pagos aprobados con importe disponible para solicitar un reembolso. Si
        coordinaste el pago por WhatsApp, puedes consultar el caso en
        <a routerLink="/soporte/nuevo" [queryParams]="{ category: 'PAGOS' }">Soporte → Pagos</a>.
      </p>
    }
    <form class="panel form-panel" #form="ngForm" (ngSubmit)="submit()">
      <label
        >Operación de pago<select
          name="transaction"
          [(ngModel)]="transactionId"
          (ngModelChange)="selectOperation()"
          [disabled]="operationsLoading() || !operations().length"
          required
        >
          <option [ngValue]="null">Selecciona una operación</option>
          @for (p of operations(); track p.id) {
            <option [ngValue]="p.id">
              {{ p.orderCode }} · Pago #{{ p.id }} · {{ p.amount | number: '1.2-2' }}
              {{ p.currency }}
            </option>
          }
        </select></label
      >
      @if (selected(); as p) {
        <div class="notice">
          <p>
            Importe original: <strong>{{ p.amount | number: '1.2-2' }} {{ p.currency }}</strong>
          </p>
          <p>
            Disponible para solicitar:
            <strong>{{ p.eligibleAmount | number: '1.2-2' }} {{ p.currency }}</strong>
          </p>
        </div>
      }
      <div class="form-grid">
        <label
          >Importe solicitado<input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            [max]="selected()?.eligibleAmount || 0"
            [(ngModel)]="amount"
            required /></label
        ><label
          >Motivo<select name="reason" [(ngModel)]="reason" required>
            <option value="">Selecciona</option>
            @for (option of reasons; track option[0]) {
              <option [value]="option[0]">{{ option[1] }}</option>
            }
          </select></label
        >
      </div>
      <label
        >Descripción<textarea
          name="description"
          [(ngModel)]="description"
          required
          rows="6"
          maxlength="10000"
        ></textarea></label
      ><label class="upload-area"
        >Evidencia opcional (PDF, PNG o JPG, hasta 5 MB)<input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          (change)="choose($event)"
      /></label>
      <p class="muted">
        Esta solicitud registra una decisión de práctica. No se realizan transferencias.
      </p>
      <button [disabled]="form.invalid || busy() || !selected()">
        {{ busy() ? 'Registrando…' : 'Enviar solicitud' }}
      </button>
    </form>`,
  styleUrl: './support.css',
})
export class RefundFormComponent implements OnInit {
  private s = inject(SupportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly ticketId = Number(this.route.snapshot.queryParamMap.get('ticketId')) || null;
  operations = signal<Operation[]>([]);
  operationsLoading = signal(true);
  error = signal('');
  busy = signal(false);
  transactionId: number | null = null;
  amount: number | null = null;
  readonly reasons = Object.entries(REFUND_REASONS);
  reason = '';
  description = '';
  file: File | null = null;
  ngOnInit() {
    this.s
      .operations()
      .pipe(finalize(() => this.operationsLoading.set(false)))
      .subscribe({
        next: (p) => this.operations.set(p.filter((v) => v.eligibleAmount > 0)),
        error: (e) => this.error.set(supportError(e)),
      });
  }
  selected() {
    return this.operations().find((p) => p.id === this.transactionId);
  }
  selectOperation() {
    this.amount = this.selected()?.eligibleAmount || null;
  }
  choose(e: Event) {
    this.file = (e.target as HTMLInputElement).files?.[0] || null;
  }
  submit() {
    if (this.busy()) return;
    if (this.file && this.file.size > 5 * 1024 * 1024) {
      this.error.set('Máximo 5 MB');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.s
      .createRefund({
        transactionId: this.transactionId,
        ticketId: this.ticketId,
        requestedAmount: this.amount,
        reason: this.reason,
        description: this.description,
      })
      .subscribe({
        next: (r) => {
          if (this.file)
            this.s.upload(r.ticketId, this.file).subscribe({
              next: () => this.router.navigate(['/soporte/reembolsos']),
              error: (e) => {
                this.router.navigate(['/soporte/tickets', r.ticketId], {
                  state: {
                    uploadError:
                      'Reembolso registrado. No se pudo adjuntar la evidencia: ' + supportError(e),
                  },
                });
              },
            });
          else this.router.navigate(['/soporte/reembolsos']);
        },
        error: (e) => {
          this.error.set(supportError(e));
          this.busy.set(false);
        },
      });
  }
}
