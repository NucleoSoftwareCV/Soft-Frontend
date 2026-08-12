import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../environments/environment';

declare const google: any;

/**
 * Renderiza el boton oficial de "Sign in with Google" bajo demanda y entrega
 * el id_token resultante via callback, para enviarlo a POST /api/auth/google.
 * Se usa el boton real (no el prompt/"One Tap" silencioso) porque Google
 * suprime el prompt automatico tras un rechazo previo o por politicas de
 * cookies de terceros, mientras que el boton siempre abre el selector de
 * cuenta al hacer click. Requiere environment.googleClientId configurado.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);
  private scriptLoadPromise: Promise<void> | null = null;

  renderButton(
    container: HTMLElement,
    onToken: (idToken: string) => void,
    onError: (message: string) => void
  ): void {
    if (!this.isBrowser) {
      return;
    }
    if (!environment.googleClientId) {
      onError('Google Sign-In no está configurado todavía.');
      return;
    }

    this.loadScript()
      .then(() => {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: { credential?: string }) => {
            this.ngZone.run(() => {
              if (response?.credential) {
                onToken(response.credential);
              } else {
                onError('No se recibió el token de Google.');
              }
            });
          },
        });

        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'es',
          width: 320,
        });
      })
      .catch(() => {
        this.ngZone.run(() => onError('No se pudo cargar Google Identity Services.'));
      });
  }

  private loadScript(): Promise<void> {
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }
}
