import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly googleIdentity = inject(GoogleIdentityService);

  private readonly googleBtnContainer = viewChild<ElementRef<HTMLElement>>('googleBtn');

  constructor() {
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

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  firstName = signal('');
  lastName = signal('');

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

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

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
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
            this.router.navigate(['/onboarding']);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
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

  private handleGoogleToken(idToken: string): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.loginWithGoogle({ idToken }).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.newlyRegistered || response.onboardingRequired) {
          this.router.navigate(['/onboarding']);
        } else if (this.authService.roles.includes('PROFESSIONAL')) {
          this.router.navigate(['/']); // o manejo correspondiente
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
