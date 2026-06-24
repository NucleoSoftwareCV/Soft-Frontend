import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  UserDTO,
  TokenRefreshResponse
} from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser  = isPlatformBrowser(this.platformId);

  private readonly BASE = `${environment.apiUrl}/auth`;
  readonly currentUser = signal<JwtResponse | null>(this.loadUserFromStorage());

  get isLoggedIn(): boolean  { return this.currentUser() !== null; }
  get token():      string   { return this.currentUser()?.token ?? ''; }
  get roles():      string[] { return this.currentUser()?.roles ?? []; }

  register(request: RegisterRequest): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.BASE}/register`, request);
  }

  login(request: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.BASE}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const currentSession = this.currentUser();
    if (!currentSession?.refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<TokenRefreshResponse>(`${this.BASE}/refresh-token`, {
      refreshToken: currentSession.refreshToken
    }).pipe(
      tap(response => {
        const updatedSession: JwtResponse = {
          ...currentSession,
          token: response.accessToken,
          refreshToken: response.refreshToken,
          type: response.tokenType
        };
        this.saveSession(updatedSession);
      })
    );
  }

  logout(): void {
    const currentSession = this.currentUser();
    
    if (currentSession?.refreshToken) {
      this.http.post(`${this.BASE}/logout`, { refreshToken: currentSession.refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    if (this.isBrowser) {
      localStorage.removeItem('oona_session');
    }
    this.currentUser.set(null);
  }

  private saveSession(response: JwtResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('oona_session', JSON.stringify(response));
    }
    this.currentUser.set(response);
  }

  private loadUserFromStorage(): JwtResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem('oona_session');
      return raw ? (JSON.parse(raw) as JwtResponse) : null;
    } catch {
      return null;
    }
  }
}