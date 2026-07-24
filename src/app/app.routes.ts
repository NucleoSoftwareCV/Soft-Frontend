import { Routes } from '@angular/router';
import { SesionesComponent } from './features/sesiones/sesiones';
import { SesionDetalleComponent } from './features/sesion-detalle/sesion-detalle';
import { Eventos } from './features/explorar/eventos/eventos';
import { DetalleEvento } from './features/explorar/detalle-evento/detalle-evento';
import { Directorio } from './features/profesionales/directorio/directorio';
import { PerfilProfesional } from './features/profesionales/perfil-profesional/perfil-profesional';


export const routes: Routes = [
  { path: 'sesiones', component: SesionesComponent },
  { path: 'sesiones/:id', component: SesionDetalleComponent },

  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
  },

  { path: 'explorar', component: Eventos },
  { path: 'evento/:id', component: DetalleEvento },
  
  { path: 'profesionales', component: Directorio },
  { path: 'profesionales/:slug', component: PerfilProfesional },

  

  
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
