import { Routes } from '@angular/router';
import { SupportShellComponent } from './support-shell.component';
import { supportLoginGuard } from './support.guards';
import { adminGuard } from '../../core/guards/admin.guard';

export const SUPPORT_ROUTES: Routes = [
  {
    path: 'soporte',
    component: SupportShellComponent,
    children: [
      {
        path: 'ingresar',
        loadComponent: () =>
          import('./support-sign-in.component').then((m) => m.SupportSignInComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./support-center.component').then((m) => m.SupportCenterComponent),
      },
      {
        path: 'nuevo',
        canActivate: [supportLoginGuard],
        loadComponent: () => import('./ticket-form.component').then((m) => m.TicketFormComponent),
      },
      {
        path: 'tickets',
        canActivate: [supportLoginGuard],
        loadComponent: () => import('./ticket-list.component').then((m) => m.TicketListComponent),
      },
      {
        path: 'tickets/:id',
        canActivate: [supportLoginGuard],
        loadComponent: () =>
          import('./ticket-detail.component').then((m) => m.TicketDetailComponent),
      },
      {
        path: 'reembolsos/nuevo',
        canActivate: [supportLoginGuard],
        loadComponent: () => import('./refund-form.component').then((m) => m.RefundFormComponent),
      },
      {
        path: 'reembolsos',
        canActivate: [supportLoginGuard],
        loadComponent: () => import('./refund-list.component').then((m) => m.RefundListComponent),
      },
    ],
  },
];

export const ADMIN_SUPPORT_ROUTES: Routes = [
  {
    path: 'soporte',
    component: SupportShellComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./support-dashboard.component').then((m) => m.SupportDashboardComponent),
      },
      {
        path: 'tickets',
        loadComponent: () => import('./ticket-list.component').then((m) => m.TicketListComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./ticket-detail.component').then((m) => m.TicketDetailComponent),
      },
      {
        path: 'reembolsos',
        loadComponent: () => import('./refund-list.component').then((m) => m.RefundListComponent),
      },
    ],
  },
];
