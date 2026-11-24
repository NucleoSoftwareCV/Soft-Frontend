import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  JwtResponse,
  LoginRequest,
  PasswordResetResponse,
  RegisterRequest,
  ResetPasswordRequest,
  TokenRefreshResponse,
  UserDTO
} from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser =
    isPlatformBrowser(this.platformId);

  private readonly BASE =
    `${environment.apiUrl.replace('/v1', '')}/auth`;

  readonly currentUser = signal<JwtResponse | null>(
    this.loadUserFromStorage()
  );

  get isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  get token(): string {
    return this.currentUser()?.token ?? '';
  }

  get roles(): string[] {
    return this.currentUser()?.roles ?? [];
  }

  register(
    request: RegisterRequest
  ): Observable<UserDTO> {
    return this.http.post<UserDTO>(
      `${this.BASE}/register`,
      request
    );
  }

  login(
    request: LoginRequest
  ): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(
      `${this.BASE}/login`,
      request
    ).pipe(
      tap(response => {
        this.saveSession(response);
      })
    );
  }

  adminLogin(
    request: LoginRequest
  ): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(
      `${environment.apiUrl}/auth/admin/login`,
      request
    ).pipe(
      tap(response => {
        this.saveSession(response);
      })
    );
  }

  loginWithGoogle(
    request: GoogleLoginRequest
  ): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(
      `${this.BASE}/google`,
      request
    ).pipe(
      tap(response => {
        this.saveSession(response);
      })
    );
  }

  forgotPassword(
    request: ForgotPasswordRequest
  ): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(
      `${this.BASE}/forgot-password`,
      request
    );
  }

  resetPassword(
    request: ResetPasswordRequest
  ): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(
      `${this.BASE}/reset-password`,
      request
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {

    const currentSession =
      this.currentUser();

    if (!currentSession?.refreshToken) {
      throw new Error(
        'No refresh token available'
      );
    }

    return this.http.post<TokenRefreshResponse>(
      `${this.BASE}/refresh-token`,
      {
        refreshToken:
          currentSession.refreshToken
      }
    ).pipe(
      tap(response => {

        const updatedSession: JwtResponse = {
          ...currentSession,
          token: response.accessToken,
          refreshToken:
            response.refreshToken ||
            currentSession.refreshToken,
          type:
            response.tokenType ||
            currentSession.type,
          roles:
            response.roles?.length
              ? response.roles
              : currentSession.roles
        };

        this.saveSession(
          updatedSession
        );
      })
    );
  }

  logout(): void {

    const currentSession =
      this.currentUser();

    if (currentSession?.refreshToken) {

      this.http.post(
        `${this.BASE}/logout`,
        {
          refreshToken:
            currentSession.refreshToken
        }
      )
      .pipe(
        catchError(() =>
          of(null)
        )
      )
      .subscribe();
    }

    this.clearSession();
  }

  clearSession(): void {

    if (this.isBrowser) {
      localStorage.removeItem(
        'oona_session'
      );
    }

    this.currentUser.set(null);
  }

  private saveSession(
    response: JwtResponse
  ): void {

    if (this.isBrowser) {
      localStorage.setItem(
        'oona_session',
        JSON.stringify(response)
      );
    }

    this.currentUser.set(response);
  }

  private loadUserFromStorage():
    JwtResponse | null {

    if (!this.isBrowser) {
      return null;
    }

    try {

      const raw =
        localStorage.getItem(
          'oona_session'
        );

      if (!raw) {
        return null;
      }

      const session =
        JSON.parse(raw) as JwtResponse;

      if (
        !session.token ||
        !session.refreshToken
      ) {
        return null;
      }

      return session;

    } catch {
      return null;
    }
  }
}