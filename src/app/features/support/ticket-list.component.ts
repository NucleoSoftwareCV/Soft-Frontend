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
} from './models/support.model';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">{{ s.management ? 'BANDEJA DE ATENCIÓN' : 'SEGUIMIENTO' }}</span>
        <h1>{{ s.management ? 'Tickets recibidos' : 'Mis solicitudes' }}</h1>
        <p>{{ total() }} solicitudes registradas</p>
      </div>
      @if (!s.management) {
        <a class="button" routerLink="/soporte/nuevo">＋ Nuevo ticket</a>
      }
      <button class="secondary" (click)="load()">Actualizar</button>
    </div>
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    @if (s.management) {
      <div class="panel filters">
        <label
          >Tipo de reporte<select [(ngModel)]="filters.complaints" (ngModelChange)="filter()">
            <option value="">Todos</option>
            <option value="true">Con referencia de reclamación</option>
          </select></label
        ><label
          >Categoría<select [(ngModel)]="filters.category" (ngModelChange)="filter()">
            <option value="">Todas</option>
            @for (c of categories; track c) {
              <option>{{ c }}</option>
            }
          </select></label
        ><label
          >Estado<select [(ngModel)]="filters.status" (ngModelChange)="filter()">
            <option value="">Todos</option>
            @for (c of statuses; track c) {
              <option>{{ c }}</option>
            }
          </select></label
        ><label
          >Prioridad<select [(ngModel)]="filters.priority" (ngModelChange)="filter()">
            <option value="">Todas</option>
            @for (c of priorities; track c) {
              <option>{{ c }}</option>
            }
          </select></label
        >
      </div>
    }
    <div class="panel table-wrap">
      <table class="support-card-table" role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Ticket</th>
            <th scope="col" role="columnheader">Asunto</th>
            <th scope="col" role="columnheader">Estado</th>
            <th scope="col" role="columnheader">Prioridad</th>
            <th scope="col" role="columnheader">Categoría</th>
            <th scope="col" role="columnheader">Actualización</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          @for (t of items(); track t.id) {
            <tr role="row">
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Ticket</span>
                <div class="support-card-value">
                  <a [routerLink]="[s.root + '/tickets', t.id]">{{ t.ticketNumber }}</a>
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Asunto</span>
                <div class="support-card-value">
                  <a [routerLink]="[s.root + '/tickets', t.id]">{{ t.subject }}</a>
                  @if (s.management) {
                    <small>{{ t.userName }}</small>
                  }
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Estado</span>
                <div class="support-card-value">
                  <span
                    class="badge"
                    [class.success]="t.status === 'RESUELTO' || t.status === 'CERRADO'"
                    >{{ t.status }}</span
                  >
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Prioridad</span>
                <div class="support-card-value">
                  <span
                    class="badge"
                    [class.danger]="t.priority === 'CRITICA' || t.priority === 'ALTA'"
                    >{{ t.priority }}</span
                  >
                </div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Categoría</span>
                <div class="support-card-value">{{ t.category }}</div>
              </td>
              <td role="cell">
                <span class="support-card-label" aria-hidden="true">Actualización</span>
                <div class="support-card-value">{{ t.updatedAt | date: 'dd/MM/yy HH:mm' }}</div>
              </td>
            </tr>
          } @empty {
            <tr role="row">
              <td role="cell" colspan="6">
                {{ loading() ? 'Cargando solicitudes…' : 'No hay solicitudes para mostrar.' }}
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
    </div>`,
  styleUrl: './support.css',
})
export class TicketListComponent implements OnInit {
  readonly s = inject(SupportService);
  categories = CATEGORIES;
  statuses = STATUSES;
  priorities = PRIORITIES;
  private route = inject(ActivatedRoute);
  filters = { complaints: '', category: '', status: '', priority: '' };
  items = signal<SupportTicket[]>([]);
  error = signal('');
  loading = signal(false);
  page = 0;
  pages = signal(0);
  total = signal(0);
  ngOnInit() {
    this.filters.complaints =
      this.route.snapshot.queryParamMap.get('complaints') === 'true' ? 'true' : '';
    this.load();
  }
  filter() {
    this.page = 0;
    this.load();
  }
  load() {
    this.error.set('');
    this.loading.set(true);
    this.s.tickets(this.page, this.filters).subscribe({
      next: (d) => {
        this.items.set(d.content);
        this.total.set(d.totalElements);
        this.pages.set(d.totalPages);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(supportError(e));
        this.loading.set(false);
      },
    });
  }
}
