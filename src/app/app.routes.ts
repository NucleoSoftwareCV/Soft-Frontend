import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Oona | Eventos y profesionales de bienestar cerca de ti',
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
