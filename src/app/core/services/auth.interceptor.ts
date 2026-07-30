import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import {
  catchError,
  finalize,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

import { TokenRefreshResponse } from '../../shared/models/auth.model';
import { AuthService } from './auth.service';

let refreshRequest$: Observable<TokenRefreshResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authenticatedRequest = isAuthenticationRequest(request.url)
    ? request
    : addAuthorizationHeader(request, authService.token);

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (
        isAuthenticationRequest(request.url)
        || !authService.currentUser()?.refreshToken
      ) {
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authService.refreshToken().pipe(
          finalize(() => {
            refreshRequest$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }

      return refreshRequest$.pipe(
        switchMap(() =>
          next(addAuthorizationHeader(request, authService.token))
        ),
        catchError(refreshError => {
          authService.logout();
          router.navigate(['/auth/login'], {
            queryParams: { expired: 'true' },
          });
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function addAuthorizationHeader(
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  if (!token) return request;

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isAuthenticationRequest(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/refresh-token')
    || url.includes('/auth/logout');
}
