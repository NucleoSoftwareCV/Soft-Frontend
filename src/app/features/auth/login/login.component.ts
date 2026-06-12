import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

/** Tipo de cuenta seleccionada en los tabs */
type AccountType = 'usuario' | 'profesional';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.css',
})
export class LoginComponent {

  /** Tab activo */
  activeTab = signal<AccountType>('usuario');

  /** Datos del formulario */
  email      = signal('');
  password   = signal('');

  /** Contraseña visible/oculta */
  showPassword = signal(false);

  /** Estado de carga (futuro: conectar al servicio de auth) */
  isLoading  = signal(false);

  selectTab(tab: AccountType): void {
    this.activeTab.set(tab);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) return;
    this.isLoading.set(true);
    /**
     * TODO: conectar con AuthService cuando exista el backend.
     * Por ahora sólo simula el estado de carga.
     */
    setTimeout(() => this.isLoading.set(false), 1500);
  }

  onGoogleLogin(): void {
    /** TODO: integrar OAuth con Google */
    console.info('Google login — pendiente de integración');
  }
}
