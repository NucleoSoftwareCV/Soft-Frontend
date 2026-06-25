import { Routes } from '@angular/router';
import { SesionesComponent } from './features/sesiones/sesiones';
import { SesionDetalleComponent } from './features/sesion-detalle/sesion-detalle';
import { Explorar } from './features/explorar/explorar';
import { DetalleEvento } from './features/detalle-evento/detalle-evento';

export const routes: Routes = [
  /* ── Tus rutas de Sesiones ── */
  { path: 'sesiones', component: SesionesComponent },
  { path: 'sesiones/:id', component: SesionDetalleComponent },

  /* ── Home ── */
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  /* ── Explorar y Detalle (Vienen de main) ── */
  { path: 'explorar', component: Explorar },
  { path: 'detalle-evento', component: DetalleEvento },

  /* ── Auth (sin header/footer, layout propio) ── */
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

  /* ── Perfil profesional ── */
  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    title: 'Mi Perfil — Oona',
  },

  /* ── Admin ── */
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
    title: 'Panel de Administración — Oona',
  },

  {
    path: '**',
    redirectTo: '',
  },
];