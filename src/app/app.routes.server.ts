import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'explorar',
    renderMode: RenderMode.Client
  },
  {
    path: 'sesiones',
    renderMode: RenderMode.Client
  },
  {
    path: 'evento/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'sesiones/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
