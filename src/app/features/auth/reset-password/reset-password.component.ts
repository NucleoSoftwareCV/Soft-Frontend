import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: '../login/login.component.css',
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Se lee directamente de window.location (en vez de ActivatedRoute.snapshot) porque
  // el snapshot puede no reflejar aún los query params cuando la navegación es programática.
  private readonly token = this.isBrowser
    ? new URLSearchParams(window.location.search).get('token') ?? ''
    : '';

  newPassword = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly hasToken = !!this.token;

  onSubmit(): void {
    if (!this.newPassword() || !this.confirmPassword()) {
      this.errorMessage.set('Completa ambos campos para continuar.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({ token: this.token, newPassword: this.newPassword() }).subscribe({
      next: response => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No se pudo restablecer la contraseña. Solicita un nuevo enlace.');
      }
    });
  }
}
