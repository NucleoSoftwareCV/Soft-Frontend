import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'sesiones',
    loadComponent: () =>
      import('./features/sesiones/sesiones')
        .then(m => m.SesionesComponent),
  },

  {
    path: 'sesiones/:id',
    loadComponent: () =>
      import('./features/sesion-detalle/sesion-detalle')
        .then(m => m.SesionDetalleComponent),
  },

  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component')
        .then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  // =========================
  // EXPLORAR
  // =========================

  {
    path: 'explorar',
    loadComponent: () =>
      import('./features/explorar/eventos/eventos')
        .then(m => m.Eventos),
  },

  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./features/explorar/detalle-evento/detalle-evento')
        .then(m => m.DetalleEvento),
  },

  // =========================
  // PROFESIONALES
  // =========================

  {
    path: 'profesionales',
    loadComponent: () =>
      import('./features/profesionales/directorio/directorio')
        .then(m => m.Directorio),
  },

  {
    path: 'profesionales/:slug',
    loadComponent: () =>
      import('./features/profesionales/perfil-profesional/perfil-profesional')
        .then(m => m.PerfilProfesional),
  },

  // =========================
  // MATCH DE BIENESTAR
  // =========================

  {
    path: 'match-bienestar',
    loadComponent: () =>
      import('./features/match-bienestar/match-bienestar')
        .then(m => m.MatchBienestarComponent),
    title: 'Match de Bienestar - Oona',
  },

  {
    path: 'conocer-gente',
    redirectTo: 'match-bienestar',
    pathMatch: 'full'
  },

  {
    path: 'circulo-oona',
    loadComponent: () =>
      import('./features/circulo-oona/circulo-oona.component')
        .then(m => m.CirculoOonaComponent),
    title: 'Circulo Oona | Solicitud profesional',
  },

  // =========================
  // AUTENTICACIÓN
  // =========================

  {
    path: 'auth/erp/login',
    loadComponent: () =>
      import('./features/auth/admin-login/admin-login.component')
        .then(m => m.AdminLoginComponent),
    title: 'Acceso ERP - Oona',
  },

  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth-shell/auth-shell.component')
        .then(m => m.AuthShellComponent),

    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component')
            .then(m => m.LoginComponent),

        title: 'Iniciar sesion - Oona',
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

  // =========================
  // PERFIL
  // =========================

  {
    path: 'perfil',
    canActivate: [roleGuard('USER')],
    loadComponent: () =>
      import('./features/perfil/perfil.component')
        .then(m => m.PerfilComponent),

    title: 'Mi Perfil - Oona',
  },

  // =========================
  // ADMIN
  // =========================

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin.component')
        .then(m => m.AdminComponent),

    title: 'Panel de Administracion - Oona',
  },

  {
    path: 'profesional',
    canActivate: [roleGuard('PROFESSIONAL')],
    loadComponent: () =>
      import('./features/professional-portal/professional-portal.component')
        .then(m => m.ProfessionalPortalComponent),
    title: 'Panel profesional - Oona',
  },

  {
    path: '**',
    redirectTo: '',
  },
];
