import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('renders parameterized public detail routes on the server instead of prerendering them', () => {
    expect(serverRoutes).toContainEqual({
      path: 'eventos',
      renderMode: RenderMode.Client,
    });
    expect(serverRoutes).toContainEqual({
      path: 'evento/:id',
      renderMode: RenderMode.Server,
    });
  });

  it('renders one-to-one session routes on the client because they load live API data', () => {
    expect(serverRoutes).toContainEqual({
      path: 'sesiones',
      renderMode: RenderMode.Client,
    });
    expect(serverRoutes).toContainEqual({
      path: 'sesiones/:id',
      renderMode: RenderMode.Client,
    });
  });
});
