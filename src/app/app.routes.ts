import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'sesiones',
    loadComponent: () =>
      import('./features/sesiones/sesiones').then(m => m.SesionesComponent),
  },
  {
    path: 'sesiones/:id',
    loadComponent: () =>
      import('./features/sesion-detalle/sesion-detalle').then(m => m.SesionDetalleComponent),
  },

  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  {
    path: 'explorar',
    loadComponent: () =>
      import('./features/explorar/explorar').then(m => m.Explorar),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./features/detalle-evento/detalle-evento').then(m => m.DetalleEvento),
  },

  {
    path: 'match-bienestar',
    loadComponent: () =>
      import('./features/match-bienestar/match-bienestar').then(m => m.MatchBienestarComponent),
    title: 'Match de Bienestar - Oona',
  },
  {
    path: 'conocer-gente',
    redirectTo: 'match-bienestar',
    pathMatch: 'full'
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

  {
    path: 'profesionales',
    loadComponent: () =>
      import('./features/profesionales/profesionales.component').then(m => m.ProfesionalesComponent),
    title: 'Oona | Descubre a Nuestros Profesionales de Bienestar',
  },

  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    title: 'Mi Perfil - Oona',
  },

  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
    title: 'Panel de Administracion - Oona',
  },

  {
    path: '**',
    redirectTo: '',
  },
];
