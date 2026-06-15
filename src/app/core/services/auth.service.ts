import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  UserDTO,
} from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser  = isPlatformBrowser(this.platformId);

  private readonly BASE = `${environment.apiUrl}/auth`;

  // ── Estado reactivo del usuario logueado ──
  readonly currentUser = signal<JwtResponse | null>(this.loadUserFromStorage());

  // ── Helpers de estado ──
  get isLoggedIn(): boolean  { return this.currentUser() !== null; }
  get token():      string   { return this.currentUser()?.token ?? ''; }
  get roles():      string[] { return this.currentUser()?.roles ?? []; }

  // ----------------------------------------------------------
  // POST /api/v1/auth/register
  // Devuelve el UserDTO creado (HTTP 201)
  // ----------------------------------------------------------
  register(request: RegisterRequest): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.BASE}/register`, request);
  }

  // ----------------------------------------------------------
  // POST /api/v1/auth/login
  // Guarda el JWT en localStorage y actualiza la señal
  // ----------------------------------------------------------
  login(request: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.BASE}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // ----------------------------------------------------------
  // Cierra sesión: limpia localStorage y resetea la señal
  // ----------------------------------------------------------
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('oona_session');
    }
    this.currentUser.set(null);
  }

  // ----------------------------------------------------------
  // Privados
  // ----------------------------------------------------------
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
