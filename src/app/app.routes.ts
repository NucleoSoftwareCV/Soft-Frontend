import { Routes } from '@angular/router';
import { Explorar } from './features/explorar/explorar';
import { DetalleEvento } from './features/detalle-evento/detalle-evento';

export const routes: Routes = [
  /* ── Home ── */
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  /* ── Explorar ── */
  {
    path: 'explorar',
    component: Explorar
  },

  /* ── Detalle Evento ── */
  {
    path: 'evento/:id',
    component: DetalleEvento
  },

  /* ── Auth ── */
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth-shell/auth-shell.component').then(m => m.AuthShellComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Iniciar sesión — Oona',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  {
    path: 'profesionales',
    loadComponent: () =>
      import('./features/profesionales/profesionales.component').then(m => m.ProfesionalesComponent),
    title: 'Oona | Descubre a Nuestros Profesionales de Bienestar',
  },

  {
    path: '**',
    redirectTo: '',
  },
];