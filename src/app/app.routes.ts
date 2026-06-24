import { Routes } from '@angular/router';
import { SesionesComponent } from './features/sesiones/sesiones';
import { SesionDetalleComponent } from './features/sesion-detalle/sesion-detalle';

export const routes: Routes = [
  { path: 'sesiones', component: SesionesComponent },
  { path: 'sesiones/:id', component: SesionDetalleComponent },

  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

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
    path: '**',
    redirectTo: '',
  }
];