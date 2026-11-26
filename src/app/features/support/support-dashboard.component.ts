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
import { LucideArrowRight } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowRight],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">{{ s.admin ? 'SUPERVISIÓN GENERAL' : 'GESTIÓN OPERATIVA' }}</span>
        <h1>Resumen de soporte</h1>
        <p>Solicitudes e incidencias de Oona, en un solo lugar.</p>
      </div>
      <button class="secondary" (click)="load()">Actualizar</button>
    </div>
    @if (error()) {
      <p class="alert" role="alert">{{ error() }}</p>
    }
    @if (loading()) {
      <p>Cargando indicadores…</p>
    }
    <div class="metrics">
      @for (k of metrics; track k.key) {
        <a
          class="metric"
          [queryParams]="k.key === 'reclamaciones' ? { complaints: 'true' } : {}"
          [routerLink]="s.root + (k.key === 'reembolsos' ? '/reembolsos' : '/tickets')"
          ><span>{{ k.label }}</span
          ><strong>{{ data()[k.key] || 0 }}</strong
          ><small>Ver solicitudes <svg lucideArrowRight aria-hidden="true"></svg></small
        ></a>
      }
    </div>
    <section class="panel">
      <h2>{{ s.admin ? 'Supervisión y control' : 'Tu espacio de atención' }}</h2>
      <p>
        {{
          s.admin
            ? 'Revisa y atiende los tickets y gestiona las solicitudes de reembolso.'
            : 'Consulta la bandeja, revisa evidencias y da seguimiento a las solicitudes asignadas.'
        }}
      </p>
      <a class="button" [routerLink]="s.root + '/tickets'">Abrir bandeja</a>
    </section>`,
  styleUrl: './support.css',
})
export class SupportDashboardComponent implements OnInit {
  readonly s = inject(SupportService);
  data = signal<Record<string, number>>({});
  error = signal('');
  loading = signal(false);
  metrics = [
    { key: 'total', label: 'Total de tickets' },
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'EN_REVISION', label: 'En revisión' },
    { key: 'ESPERANDO_USUARIO', label: 'Esperando usuario' },
    { key: 'RESUELTO', label: 'Resueltos' },
    { key: 'reembolsos', label: 'Reembolsos' },
    { key: 'criticos', label: 'Críticos' },
    { key: 'reclamaciones', label: 'Reportes de reclamaciones' },
  ];
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.s.dashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(supportError(e));
        this.loading.set(false);
      },
    });
  }
}
