import { Routes } from '@angular/router';

export const routes: Routes = [
  /* ── Home ── */
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  /* ── Auth (sin header/footer, layout propio) ── */
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

  /* ── Alias corto /login → /auth/login ── */
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  /* ── 404 ── */
  {
    path: '**',
    redirectTo: '',
  },
];
