import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'explorar',
    renderMode: RenderMode.Client
  },
   {
    path: 'evento/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'profesionales',
    renderMode: RenderMode.Client
  },
   {
    path: 'profesionales/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'sesiones',
    renderMode: RenderMode.Client
  },

  {
    path: 'sesiones/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'match-bienestar',
    renderMode: RenderMode.Client
  },
  {
    path: 'conocer-gente',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
