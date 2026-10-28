import { Component, ElementRef, effect, inject, signal, viewChild, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

type AccountType = 'usuario' | 'profesional';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);
  private readonly googleIdentity = inject(GoogleIdentityService);

  private readonly googleBtnContainer = viewChild<ElementRef<HTMLElement>>('googleBtn');

  constructor() {
    if (this.isBrowser) {
      setTimeout(() => {
        if (new URLSearchParams(window.location.search).get('expired') === 'true') {
          this.ngZone.run(() => this.showError('Tu sesión ha expirado. Inicia sesión de nuevo.'));
        }
      }, 0);
    }

    effect(() => {
      const container = this.googleBtnContainer();
      if (container) {
        this.googleIdentity.renderButton(
          container.nativeElement,
          idToken => this.handleGoogleToken(idToken),
          message => this.showError(message)
        );
      }
    });
  }

  activeTab = signal<AccountType>('usuario');

  email = signal('');
  password = signal('');

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  roleChoice = signal(false);

  private errorTimeout?: ReturnType<typeof setTimeout>;

  private showError(message: string): void {
    clearTimeout(this.errorTimeout);
    this.errorMessage.set(message);
    this.errorTimeout = setTimeout(() => this.errorMessage.set(null), 5000);
  }

  dismissError(): void {
    clearTimeout(this.errorTimeout);
    this.errorMessage.set(null);
  }

  selectTab(tab: AccountType): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.showError('Completa tu email y contraseña para continuar.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({
      username: this.email(),
      password: this.password()
    }).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.onboardingRequired) {
          this.router.navigate(['/onboarding']);
        } else if (this.authService.roles.includes('PROFESSIONAL')) {
          this.roleChoice.set(true);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showError('Credenciales incorrectas o error en el servidor');
        console.error(err);
      }
    });
  }

  goToPublicSite(): void {
    this.roleChoice.set(false);
    this.router.navigate(['/']);
  }

  goToProfessionalPanel(): void {
    this.roleChoice.set(false);
    this.router.navigate(['/profesional']);
  }

  private handleGoogleToken(idToken: string): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.loginWithGoogle({ idToken }).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.newlyRegistered || response.onboardingRequired) {
          this.router.navigate(['/onboarding']);
        } else if (this.authService.roles.includes('PROFESSIONAL')) {
          this.roleChoice.set(true);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showError('No se pudo iniciar sesión con Google.');
        console.error(err);
      }
    });
  }
}
