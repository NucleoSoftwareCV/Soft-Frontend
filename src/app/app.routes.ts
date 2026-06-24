import { Routes } from '@angular/router';
import { Explorar } from './features/explorar/explorar';
import { DetalleEvento } from './features/detalle-evento/detalle-evento';

export const routes: Routes = [
  {
    path: 'explorar',
    component: Explorar
  },
  {
    path: '',
    redirectTo: 'explorar',
    pathMatch: 'full'
  },

  {
    path: 'evento/:id',
    component: DetalleEvento
  },
  
];