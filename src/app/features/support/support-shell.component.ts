import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideHeadset,
  LucideLayoutDashboard,
  LucidePlus,
  LucideRotateCcw,
} from '@lucide/angular';
import { SupportService } from './services/support.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideClipboardList,
    LucideHeadset,
    LucideLayoutDashboard,
    LucidePlus,
    LucideRotateCcw,
  ],
  template: `
    <div class="support-content" [class.embedded]="s.admin">
      <nav class="support-nav" aria-label="Soporte">
        <a
          [routerLink]="s.root"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          @if (s.management) {
            <svg lucideLayoutDashboard aria-hidden="true"></svg> Resumen
          } @else {
            <svg lucideHeadset aria-hidden="true"></svg> Centro de soporte
          }
        </a>
        <a
          [routerLink]="s.root + '/tickets'"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <svg lucideClipboardList aria-hidden="true"></svg>
          {{ s.management ? 'Bandeja de tickets' : 'Mis solicitudes' }}
        </a>
        <a
          [routerLink]="s.root + '/reembolsos'"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <svg lucideRotateCcw aria-hidden="true"></svg>
          {{ s.management ? 'Reembolsos' : 'Mis reembolsos' }}
        </a>
        @if (!s.management) {
          <a
            [routerLink]="s.root + '/nuevo'"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
          >
            <svg lucidePlus aria-hidden="true"></svg> Crear ticket
          </a>
        }
      </nav>
      <router-outlet />
    </div>
  `,
  styleUrl: './support.css',
})
export class SupportShellComponent {
  readonly s = inject(SupportService);
}
