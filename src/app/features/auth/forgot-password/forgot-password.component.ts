import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);

  email = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email()) {
      this.errorMessage.set('Introduce tu email para continuar.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.forgotPassword({ email: this.email() }).subscribe({
      next: response => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No se pudo procesar la solicitud. Inténtalo de nuevo.');
      }
    });
  }
}
