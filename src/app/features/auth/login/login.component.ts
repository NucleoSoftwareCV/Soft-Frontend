import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type AccountType = 'usuario' | 'profesional';
type ViewType = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  activeTab = signal<AccountType>('usuario');
  currentView = signal<ViewType>('login');

  email = signal('');
  password = signal('');
  username = signal('');
  
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  selectTab(tab: AccountType): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  setView(view: ViewType): void {
    this.currentView.set(view);
    this.errorMessage.set(null);
    this.email.set('');
    this.password.set('');
    this.username.set('');
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({
      username: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Credenciales incorrectas o error en el servidor');
        console.error(err);
      }
    });
  }

  onRegisterSubmit(): void {
    if (!this.username() || !this.email() || !this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      username: this.username(),
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.authService.login({
          username: this.username(),
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
        this.errorMessage.set('Error al registrar el usuario. Nombre o email duplicados.');
        console.error(err);
      }
    });
  }

  onGoogleLogin(): void {
    console.info('Google login — pendiente de integración');
  }
}