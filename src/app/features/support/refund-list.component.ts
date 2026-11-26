import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
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
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">SEGUIMIENTO FINANCIERO</span>
        <h1>{{ s.management ? 'Gestión de reembolsos' : 'Mis reembolsos' }}</h1>
        <p>Consulta la decisión registrada para cada solicitud de reembolso de práctica.</p>
      </div>
      @if (!s.management) {
        <a class="button" routerLink="/soporte/reembolsos/nuevo">＋ Solicitar reembolso</a>
      }
      <button class="secondary" (click)="load()">Actualizar</button>
    </div>
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    <div class="panel table-wrap">
      <table class="support-card-table" role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Solicitud</th>
            <th scope="col" role="columnheader">Operación</th>
            <th scope="col" role="columnheader">Solicitado</th>
            <th scope="col" role="columnheader">Aprobado</th>
            <th scope="col" role="columnheader">Estado</th>
            <th scope="col" role="columnheader">Acciones</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          @for (r of items(); track r.id) {
            <tr role="row">
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Solicitud</span>
                <div class="support-card-value">
                  <a [routerLink]="[s.root + '/tickets', r.ticketId]">{{ r.ticketNumber }}</a
                  ><small>{{ reasonLabels[r.reason] || r.reason }}</small>
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Operación</span>
                <div class="support-card-value">Pago #{{ r.transactionId }}</div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Solicitado</span>
                <div class="support-card-value">
                  {{ r.requestedAmount | number: '1.2-2' }} {{ r.currency }}
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Aprobado</span>
                <div class="support-card-value">
                  {{ r.approvedAmount === null ? '—' : (r.approvedAmount | number: '1.2-2') }}
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Estado</span>
                <div class="support-card-value">
                  <span
                    class="badge"
                    [class.success]="r.status === 'PROCESADO'"
                    [class.danger]="r.status === 'RECHAZADO' || r.status === 'ERROR'"
                    >{{ statusLabels[r.status] || r.status }}</span
                  >
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Acciones</span>
                <div class="support-card-value">
                  <button class="secondary" (click)="open(r)">Ver detalle</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr role="row">
              <td role="cell" colspan="6">
                {{ loading() ? 'Cargando…' : 'No hay solicitudes de reembolso.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button
        class="secondary"
        [disabled]="page === 0 || loading()"
        (click)="page = page - 1; load()"
      >
        Anterior</button
      ><span>Página {{ page + 1 }} de {{ pages() || 1 }}</span
      ><button
        class="secondary"
        [disabled]="page + 1 >= pages() || loading()"
        (click)="page = page + 1; load()"
      >
        Siguiente
      </button>
    </div>
    @if (selected(); as r) {
      <section class="panel refund-detail">
        <div class="page-heading">
          <h2>Solicitud #{{ r.id }}</h2>
          <button class="secondary" (click)="selected.set(null)">Cerrar detalle</button>
        </div>
        <ol class="refund-progress">
          @for (
            step of [
              'SOLICITADO',
              'EN_EVALUACION',
              r.status === 'RECHAZADO' ? 'RECHAZADO' : 'APROBADO',
            ];
            track step
          ) {
            <li [class.current]="r.status === step">
              {{ statusLabels[step] }}
            </li>
          }
        </ol>
        @if (r.status === 'APROBADO' || r.status === 'RECHAZADO') {
          <p class="notice">Decisión registrada · {{ statusLabels[r.status] }}</p>
        }
        <dl>
          <dt>Motivo</dt>
          <dd>{{ reasonLabels[r.reason] || r.reason }}</dd>
          <dt>Importe de la operación</dt>
          <dd>{{ r.originalAmount | number: '1.2-2' }} {{ r.currency }}</dd>
          <dt>Observación de evaluación</dt>
          <dd>{{ r.observation || 'Pendiente de evaluación' }}</dd>
        </dl>
        @if (s.staff) {
          @if (r.status === 'SOLICITADO' || r.status === 'EN_EVALUACION') {
            <form #decisionForm="ngForm">
              <div class="form-grid">
                <label
                  >Importe autorizado<input
                    type="number"
                    name="approved"
                    [(ngModel)]="approvedAmount"
                    min="0.01"
                    [max]="r.requestedAmount"
                    step="0.01" /></label
                ><label
                  >Motivo de decisión<textarea
                    name="reason"
                    [(ngModel)]="decisionReason"
                    required
                    maxlength="1000"
                  ></textarea>
                </label>
              </div>
              <div class="actions">
                @if (r.status === 'SOLICITADO') {
                  <button
                    class="secondary"
                    type="button"
                    [disabled]="busy()"
                    (click)="act('evaluate')"
                  >
                    Iniciar evaluación
                  </button>
                }
                <button
                  type="button"
                  [disabled]="decisionForm.invalid || !approvedAmount || busy()"
                  (click)="act('approve')"
                >
                  Aprobar</button
                ><button
                  type="button"
                  class="danger-button"
                  [disabled]="decisionForm.invalid || busy()"
                  (click)="act('reject')"
                >
                  Rechazar
                </button>
              </div>
            </form>
          }
        }
      </section>
    }`,
  styleUrl: './support.css',
})
export class RefundListComponent implements OnInit {
  readonly s = inject(SupportService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  items = signal<RefundRequest[]>([]);
  selected = signal<RefundRequest | null>(null);
  error = signal('');
  loading = signal(false);
  busy = signal(false);
  page = 0;
  pages = signal(0);
  approvedAmount: number | null = null;
  decisionReason = '';
  readonly reasonLabels = REFUND_REASONS;
  readonly statusLabels: Readonly<Record<string, string>> = {
    SOLICITADO: 'Solicitado',
    EN_EVALUACION: 'En evaluación',
    APROBADO: 'Aprobado',
    RECHAZADO: 'Rechazado',
  };
  ngOnInit() {
    this.load();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const refundId = Number(params.get('solicitud'));
      if (Number.isSafeInteger(refundId) && refundId > 0) this.openById(refundId);
    });
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.s.refunds(this.page).subscribe({
      next: (d) => {
        this.items.set(d.content);
        this.pages.set(d.totalPages);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(supportError(e));
        this.loading.set(false);
      },
    });
  }
  open(r: RefundRequest) {
    this.openById(r.id);
  }
  private openById(id: number) {
    this.s.refund(id).subscribe({
      next: (v) => {
        this.selected.set(v);
        this.approvedAmount = v.requestedAmount;
        this.decisionReason = '';
      },
      error: (e) => this.error.set(supportError(e)),
    });
  }
  act(action: 'evaluate' | 'approve' | 'reject') {
    const r = this.selected();
    if (!r || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.s
      .refundAction(r.id, action, {
        approvedAmount: this.approvedAmount,
        reason: this.decisionReason,
      })
      .subscribe({
        next: (v) => {
          this.selected.set(v);
          this.busy.set(false);
          this.load();
        },
        error: (e) => {
          this.error.set(supportError(e));
          this.busy.set(false);
        },
      });
  }
}
