import { Routes } from '@angular/router';
import { SesionesComponent } from './features/sesiones/sesiones';
import { SesionDetalleComponent } from './features/sesion-detalle/sesion-detalle';

export const routes: Routes = [
  { path: 'sesiones', component: SesionesComponent },
  { path: 'sesiones/:id', component: SesionDetalleComponent },
  { path: '', redirectTo: 'sesiones', pathMatch: 'full' }
];