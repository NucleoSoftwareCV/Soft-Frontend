import { Component, inject, signal, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

type AccountType = 'usuario' | 'profesional';
type ViewType = 'login' | 'register';
type RegisterStep = 'role-selection' | 'form';

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

  constructor() {
    if (this.isBrowser) {
      setTimeout(() => {
        if (new URLSearchParams(window.location.search).get('expired') === 'true') {
          this.ngZone.run(() => this.showError('Tu sesión ha expirado. Inicia sesión de nuevo.'));
        }
      }, 0);
    }
  }

  activeTab = signal<AccountType>('usuario');
  currentView = signal<ViewType>('login');
  registerStep = signal<RegisterStep>('role-selection');

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  firstName = signal('');
  lastName = signal('');

  showPassword = signal(false);
  showConfirmPassword = signal(false);
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

  setView(view: ViewType): void {
    this.currentView.set(view);
    this.registerStep.set('role-selection');
    this.errorMessage.set(null);
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
    this.firstName.set('');
    this.lastName.set('');
  }

  handleRegisterNavigation(): void {
    if (this.activeTab() === 'profesional') {
      this.router.navigate(['/circulo-oona']);
    } else {
      this.registerStep.set('form');
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
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
      next: () => {
        this.isLoading.set(false);
        if (this.authService.roles.includes('PROFESSIONAL')) {
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

  onRegisterSubmit(): void {
    if (!this.firstName() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.showError('Completa todos los campos obligatorios para crear tu cuenta.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.showError('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const generatedUsername = this.email().split('@')[0] + Math.floor(100 + Math.random() * 900);

    this.authService.register({
      username: generatedUsername,
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.authService.login({
          username: generatedUsername,
          password: this.password()
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.setView('login');
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showError(this.parseRegisterError(err));
        console.error(err);
      }
    });
  }

  private parseRegisterError(err: any): string {
    const body = err?.error;
    const fieldErrors: { field: string; message: string }[] = body?.errors ?? [];

    if (fieldErrors.some(e => e.field === 'password')) {
      return 'La contraseña debe tener entre 8 y 72 caracteres.';
    }
    if (fieldErrors.some(e => e.field === 'username')) {
      return 'El nombre de usuario no es válido: usa letras, números, puntos o guiones (3 a 20 caracteres).';
    }
    if (fieldErrors.some(e => e.field === 'email')) {
      return 'Introduce un email válido.';
    }
    if (body?.detail) {
      return body.detail;
    }
    return 'Error al registrar la cuenta. Inténtalo de nuevo.';
  }

  onGoogleLogin(): void {
    this.errorMessage.set(null);

    this.googleIdentity.requestIdToken()
      .then(idToken => {
        this.isLoading.set(true);
        this.authService.loginWithGoogle({ idToken }).subscribe({
          next: () => {
            this.isLoading.set(false);
            if (this.authService.roles.includes('PROFESSIONAL')) {
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
      })
      .catch(err => {
        this.showError(err?.message ?? 'No se pudo iniciar sesión con Google.');
      });
  }
}
