import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../environments/environment';

declare const google: any;

/**
 * Carga el SDK de Google Identity Services bajo demanda y resuelve un id_token
 * usando el flujo "Sign In With Google" (One Tap / prompt), para enviarlo a
 * POST /api/auth/google. Requiere environment.googleClientId configurado.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);
  private scriptLoadPromise: Promise<void> | null = null;

  requestIdToken(): Promise<string> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('Google Sign-In solo está disponible en el navegador.'));
    }
    if (!environment.googleClientId) {
      return Promise.reject(new Error('Google Sign-In no está configurado todavía.'));
    }

    return this.loadScript().then(() => new Promise<string>((resolve, reject) => {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: { credential?: string }) => {
          this.ngZone.run(() => {
            if (response?.credential) {
              resolve(response.credential);
            } else {
              reject(new Error('No se recibió el token de Google.'));
            }
          });
        },
      });

      google.accounts.id.prompt((notification: any) => {
        const dismissed = notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.();
        if (dismissed) {
          this.ngZone.run(() => reject(new Error('El inicio de sesión con Google se cerró sin completarse.')));
        }
      });
    }));
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
