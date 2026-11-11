import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localePeru from '@angular/common/locales/es-PE';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './core/services/auth.interceptor';

registerLocaleData(localePeru);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'PEN' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0500' } },
  
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideClientHydration(withEventReplay()),
    // HttpClient con fetch API (compatible con SSR) e interceptor de autenticación
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
  ]
};
