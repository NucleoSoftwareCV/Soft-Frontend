
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import {
  Observable,
  throwError,
} from 'rxjs';

import {
  catchError,
  finalize,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

import { TokenRefreshResponse } from '../../shared/models/auth.model';

import { AuthService } from './auth.service';


/*
 * Mantiene una sola petición de refresh activa.
 *
 * Si varias peticiones reciben 401 al mismo tiempo,
 * todas esperan el mismo refresh en lugar de enviar
 * varios refresh tokens simultáneamente.
 */
let refreshRequest$: Observable<TokenRefreshResponse> | null = null;


export const authInterceptor: HttpInterceptorFn = (
  request,
  next
) => {

  const authService = inject(AuthService);
  const router = inject(Router);


  /*
   * Las peticiones de autenticación no reciben
   * Authorization automáticamente.
   */
  const authenticatedRequest =
    isAuthenticationRequest(request.url)
      ? request
      : addAuthorizationHeader(
          request,
          authService.token
        );


  return next(authenticatedRequest).pipe(

    catchError((error: unknown) => {

      /*
       * Solo intentamos refresh ante un 401.
       */
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401
      ) {
        return throwError(() => error);
      }


      /*
       * Si el 401 viene de login, register, refresh, etc.,
       * NO intentamos otro refresh.
       */
      if (
        isAuthenticationRequest(request.url)
      ) {
        return throwError(() => error);
      }


      const currentSession =
        authService.currentUser();


      /*
       * No existe sesión o refresh token.
       */
      if (
        !currentSession?.refreshToken
      ) {

        redirectAfterExpiration(
          authService,
          router
        );

        return throwError(() => error);
      }


      /*
       * Si ya hay un refresh ejecutándose,
       * reutilizamos esa misma petición.
       */
      if (!refreshRequest$) {

        refreshRequest$ =
          authService.refreshToken().pipe(

            catchError(refreshError => {

              /*
               * El refresh token ya no sirve.
               * En ese caso sí debemos cerrar la sesión.
               */
              redirectAfterExpiration(
                authService,
                router
              );

              return throwError(
                () => refreshError
              );
            }),

            finalize(() => {

              /*
               * Una vez terminado el refresh,
               * permitimos otro refresh futuro.
               */
              refreshRequest$ = null;
            }),

            shareReplay({
              bufferSize: 1,
              refCount: false,
            })
          );
      }


      /*
       * Esperamos a que termine el refresh.
       *
       * AuthService ya habrá guardado el nuevo access token
       * y el nuevo refresh token en localStorage.
       */
      return refreshRequest$.pipe(

        switchMap(() => {

          const newToken =
            authService.token;


          /*
           * Reintentamos la petición original
           * utilizando el NUEVO access token.
           */
          return next(
            addAuthorizationHeader(
              request,
              newToken
            )
          );
        }),

        catchError(retryError => {

          /*
           * Si incluso con el nuevo token recibimos 401,
           * la sesión realmente ya no es válida.
           */
          if (
            retryError instanceof HttpErrorResponse &&
            retryError.status === 401
          ) {

            redirectAfterExpiration(
              authService,
              router
            );
          }

          return throwError(
            () => retryError
          );
        })
      );
    })
  );
};


/**
 * Cierra la sesión únicamente cuando realmente
 * no se pudo renovar el access token.
 */
function redirectAfterExpiration(
  authService: AuthService,
  router: Router
): void {

  const session =
    authService.currentUser();

  if (!session) {
    return;
  }


  /*
   * Determinamos si la sesión pertenece al ERP.
   */
  const isErpSession =
    session.roles.includes('ADMIN') ||
    router.url === '/admin' ||
    router.url.startsWith('/admin/');


  /*
   * Ahora sí eliminamos la sesión.
   */
  authService.clearSession();


  /*
   * Enviamos al login correspondiente.
   */
  router.navigate(
    [
      isErpSession
        ? '/auth/erp/login'
        : '/auth/login',
    ],
    {
      queryParams: {
        expired: 'true',
      },
      replaceUrl: true,
    }
  );
}


/**
 * Agrega el JWT como Bearer token.
 */
function addAuthorizationHeader(
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {

  if (!token) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}


/**
 * Determina qué endpoints son de autenticación.
 *
 * IMPORTANTE:
 * /auth/erp/login es una ruta de Angular,
 * no un endpoint HTTP del backend.
 *
 * Aquí solamente comprobamos endpoints reales
 * de Spring Boot.
 */
function isAuthenticationRequest(
  url: string
): boolean {

  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh-token') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/admin/login')
  );
}

