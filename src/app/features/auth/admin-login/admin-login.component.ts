import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideArrowRight,
  LucideKeyRound,
  LucideLockKeyhole,
  LucideShieldCheck,
  LucideUserRound,
} from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    FormsModule,
    LucideArrowRight,
    LucideKeyRound,
    LucideLockKeyhole,
    LucideShieldCheck,
    LucideUserRound,
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    if (!this.username.trim() || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.adminLogin({
      username: this.username.trim(),
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo iniciar sesión con estas credenciales.');
      },
    });
  }
}
