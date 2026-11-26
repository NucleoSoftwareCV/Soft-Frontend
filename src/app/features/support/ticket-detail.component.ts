import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupportService, supportError } from './services/support.service';
import {
  CATEGORIES,
  STATUSES,
  PRIORITIES,
  SupportTicket,
  SupportRewardsSummary,
  RefundRequest,
  Operation,
} from './models/support.model';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowLeft],
  template: `<a class="back-link" [routerLink]="s.root + '/tickets'"
      ><svg lucideArrowLeft aria-hidden="true"></svg> Volver a solicitudes</a
    >
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    @if (ticket(); as t) {
      <div class="page-heading">
        <div>
          <span class="eyebrow">{{ t.ticketNumber }} · {{ t.category }}</span>
          <h1>{{ t.subject }}</h1>
          <p>Registrado el {{ t.createdAt | date: 'dd/MM/yyyy HH:mm' }} · {{ t.userName }}</p>
        </div>
        <span class="badge">{{ t.status }}</span>
      </div>
      @if (t.category === 'REEMBOLSOS') {
        @if (t.refundRequestId) {
          <a
            class="button secondary"
            [routerLink]="s.root + '/reembolsos'"
            [queryParams]="{ solicitud: t.refundRequestId }"
            >Ver reembolso asociado</a
          >
        } @else if (!s.admin) {
          <a
            class="button secondary"
            routerLink="/soporte/reembolsos/nuevo"
            [queryParams]="{ ticketId: t.id }"
            >Vincular solicitud de reembolso</a
          >
        } @else {
          <p class="notice">Este ticket aún no tiene una solicitud de reembolso vinculada.</p>
        }
      }
      @if (s.admin && (t.category === 'REWARDS' || t.category === 'CANJES')) {
        <section class="panel" aria-labelledby="ticket-rewards">
          <h2 id="ticket-rewards">
            {{ t.category === 'CANJES' ? 'Canjes del solicitante' : 'Puntos del solicitante' }}
          </h2>
          @if (rewardsError()) {
            <p class="alert" role="alert">{{ rewardsError() }}</p>
          }
          @if (rewards(); as data) {
            <p>
              Saldo disponible <strong>{{ data.balance }} puntos</strong>
            </p>
            @for (movement of data.movements.content; track movement.id) {
              <article class="message">
                <strong>{{ movement.type === 'REDEEM' ? 'Canje' : 'Acumulación' }}</strong>
                <p>{{ movement.points }} puntos · Saldo posterior {{ movement.balanceAfter }}</p>
                <small
                  >{{ movement.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                  {{ movement.eventTitle }}</small
                >
              </article>
            } @empty {
              <p>No hay movimientos registrados.</p>
            }
            <div class="actions">
              <button
                type="button"
                class="secondary"
                [disabled]="data.movements.number === 0 || rewardsLoading()"
                (click)="loadRewards(data.movements.number - 1)"
              >
                Anterior
              </button>
              <button
                type="button"
                class="secondary"
                [disabled]="
                  data.movements.number + 1 >= data.movements.totalPages || rewardsLoading()
                "
                (click)="loadRewards(data.movements.number + 1)"
              >
                Siguiente
              </button>
            </div>
          } @else {
            <button
              type="button"
              class="secondary"
              [disabled]="rewardsLoading()"
              (click)="loadRewards()"
            >
              {{ rewardsLoading() ? 'Consultando…' : 'Consultar movimientos' }}
            </button>
          }
        </section>
      }
      <div class="detail-grid">
        <section>
          <article class="panel">
            <h2>Descripción de la incidencia</h2>
            <p class="preserve">{{ t.description }}</p>
            <div class="reference-list">
              @if (t.sessionBookingId) {
                <span>Sesión: {{ t.sessionTitle }} · {{ t.sessionBookingCode }}</span>
              }
              @if (t.complaintReference) {
                <span>Reclamación: {{ t.complaintReference }}</span>
              }
              @if (t.bookingId) {
                <span>Reserva: {{ t.bookingCode }}</span>
              }
              @if (t.eventId) {
                <span>Evento: {{ t.eventTitle }}</span>
              }
              @if (t.transactionId) {
                <span>Pago #{{ t.transactionId }}</span>
              }
            </div>
          </article>
          <article class="panel">
            <h2>Conversación</h2>
            @for (r of t.responses; track r.id) {
              <div class="message" [class.internal]="r.internal">
                <div>
                  <strong>{{ r.sender }}</strong
                  ><small
                    >{{ r.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                    {{ r.internal ? '· Nota interna' : '' }}</small
                  >
                </div>
                <p class="preserve">{{ r.message }}</p>
              </div>
            } @empty {
              <p class="muted">Todavía no hay respuestas.</p>
            }
            @if (t.status !== 'RESUELTO' && t.status !== 'CERRADO') {
              <form #replyForm="ngForm" (ngSubmit)="reply()">
                <label
                  >{{ internal ? 'Nota interna' : 'Añadir respuesta'
                  }}<textarea
                    name="message"
                    [(ngModel)]="message"
                    required
                    maxlength="10000"
                    rows="4"
                    placeholder="Escribe tu mensaje"
                  ></textarea>
                </label>
                @if (s.staff) {
                  <div class="check-row">
                    <label
                      ><input type="checkbox" name="internal" [(ngModel)]="internal" /> Nota
                      interna</label
                    ><label
                      ><input type="checkbox" name="request" [(ngModel)]="requestInformation" />
                      Solicitar información al usuario</label
                    >
                  </div>
                }
                <button type="submit" [disabled]="replyForm.invalid || busy()">
                  Enviar {{ internal ? 'nota' : 'respuesta' }}
                </button>
              </form>
            }
            @if (!s.management && (t.status === 'RESUELTO' || t.status === 'CERRADO')) {
              <form #reopenForm="ngForm" (ngSubmit)="reopen()">
                <label
                  >¿El problema persiste?<textarea
                    name="reason"
                    [(ngModel)]="reopenReason"
                    required
                    maxlength="1000"
                    placeholder="Explica por qué necesitas reabrir el caso"
                  ></textarea></label
                ><button [disabled]="reopenForm.invalid || busy()">Reabrir solicitud</button>
              </form>
            }
          </article>
          <article class="panel">
            <h2>Evidencias</h2>
            <div class="attachments">
              @for (a of t.attachments; track a.id) {
                <button class="secondary" (click)="download(a.id, a.fileName)">
                  ↓ {{ a.fileName }}
                </button>
              } @empty {
                <p>No hay archivos adjuntos.</p>
              }
            </div>
            @if (!s.admin && t.status !== 'CERRADO' && t.status !== 'RESUELTO') {
              <label class="upload-area"
                >Añadir evidencia · PDF / PNG / JPG · máx. 5 MB<input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  (change)="upload($event)"
                  [disabled]="busy()"
              /></label>
            }
          </article>
        </section>
        <aside>
          <section class="panel">
            <h2>Información del ticket</h2>
            <dl>
              <dt>Prioridad</dt>
              <dd>{{ t.priority }}</dd>
              <dt>Última actualización</dt>
              <dd>{{ t.updatedAt | date: 'dd/MM/yy HH:mm' }}</dd>
              @if (s.management) {
                <dt>Correo del solicitante</dt>
                <dd>{{ t.userEmail }}</dd>
              }
            </dl>
            @if (s.staff) {
              <form #statusForm="ngForm" (ngSubmit)="change('status')">
                <label
                  >Nuevo estado<select name="status" [(ngModel)]="status" required>
                    <option value="">Selecciona</option>
                    @for (v of allowedStatuses(); track v) {
                      <option>{{ v }}</option>
                    }
                  </select></label
                ><label
                  >Motivo del cambio<textarea
                    name="reason"
                    [(ngModel)]="statusReason"
                    required
                    maxlength="1000"
                  ></textarea></label
                ><button [disabled]="statusForm.invalid || busy()">Actualizar estado</button>
              </form>
              <form #priorityForm="ngForm" (ngSubmit)="change('priority')">
                <label
                  >Prioridad<select name="priority" [(ngModel)]="priority">
                    @for (v of priorities; track v) {
                      <option>{{ v }}</option>
                    }
                  </select></label
                ><label
                  >Motivo<input
                    name="priorityReason"
                    [(ngModel)]="priorityReason"
                    required
                    maxlength="1000" /></label
                ><button class="secondary" [disabled]="priorityForm.invalid || busy()">
                  Guardar prioridad
                </button>
              </form>
            }
          </section>
          <section class="panel">
            <h2>Historial de cambios</h2>
            <ol class="timeline">
              @for (h of t.history; track h.id) {
                <li>
                  <strong>{{ h.action }}</strong>
                  <p>{{ h.detail }}</p>
                  <small>{{ h.actor }} · {{ h.createdAt | date: 'dd/MM/yy HH:mm' }}</small>
                </li>
              }
            </ol>
          </section>
        </aside>
      </div>
    } @else {
      <p>Cargando detalle…</p>
    }`,
  styleUrl: './support.css',
})
export class TicketDetailComponent implements OnInit {
  readonly s = inject(SupportService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  ticket = signal<SupportTicket | null>(null);
  rewards = signal<SupportRewardsSummary | null>(null);
  rewardsError = signal('');
  rewardsLoading = signal(false);
  error = signal('');
  busy = signal(false);
  id = 0;
  message = '';
  internal = false;
  requestInformation = false;
  reopenReason = '';
  status = '';
  statusReason = '';
  priority = 'MEDIA';
  priorityReason = '';
  priorities = PRIORITIES;
  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.error.set(
      this.router.getCurrentNavigation()?.extras.state?.['uploadError'] ||
        (this.location.getState() as any)?.uploadError ||
        '',
    );
    this.load();
  }
  load() {
    this.s.ticket(this.id).subscribe({
      next: (t) => {
        this.ticket.set(t);
        this.priority = t.priority;
      },
      error: (e) => this.error.set(supportError(e)),
    });
  }
  loadRewards(page = 0) {
    this.rewardsLoading.set(true);
    this.rewardsError.set('');
    this.s.rewards(this.id, page).subscribe({
      next: (data) => {
        this.rewards.set(data);
        this.rewardsLoading.set(false);
      },
      error: () => {
        this.rewardsError.set('No pudimos consultar los movimientos de puntos.');
        this.rewardsLoading.set(false);
      },
    });
  }
  allowedStatuses() {
    const m: Record<string, string[]> = {
      PENDIENTE: ['EN_REVISION'],
      ASIGNADO: ['EN_REVISION', 'ESPERANDO_USUARIO'],
      EN_REVISION: ['ESPERANDO_USUARIO', 'RESUELTO'],
      ESPERANDO_USUARIO: ['EN_REVISION'],
      RESUELTO: ['CERRADO'],
      CERRADO: [],
      REABIERTO: ['EN_REVISION', 'ESPERANDO_USUARIO'],
    };
    return m[this.ticket()?.status || ''] || [];
  }
  run(request: any, done: () => void = () => {}) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: () => {
        done();
        this.busy.set(false);
        this.load();
      },
      error: (e: any) => {
        this.error.set(supportError(e));
        this.busy.set(false);
      },
    });
  }
  reply() {
    this.run(
      this.s.respond(this.id, {
        message: this.message,
        internal: this.internal,
        requestInformation: this.requestInformation,
      }),
      () => {
        this.message = '';
        this.requestInformation = false;
      },
    );
  }
  reopen() {
    this.run(this.s.reopen(this.id, this.reopenReason));
  }
  change(kind: string) {
    this.run(
      this.s.patchTicket(
        this.id,
        kind,
        kind === 'status'
          ? { status: this.status, reason: this.statusReason }
          : { priority: this.priority, reason: this.priorityReason },
      ),
      () => {
        this.status = '';
        this.statusReason = '';
        this.priorityReason = '';
      },
    );
  }
  upload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Máximo 5 MB');
      input.value = '';
      return;
    }
    this.run(this.s.upload(this.id, file), () => (input.value = ''));
  }
  download(id: number, name: string) {
    this.s.download(id).subscribe({
      next: (b) => {
        const url = URL.createObjectURL(b),
          a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (e) => this.error.set(supportError(e)),
    });
  }
}
