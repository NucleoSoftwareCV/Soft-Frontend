import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type AccountType = 'usuario' | 'profesional';
type ViewType = 'login' | 'register';
type RegisterStep = 'role-selection' | 'form' | 'professional-landing' | 'professional-type' | 'professional-google' | 'professional-form';

interface ProfessionalTypeOption {
  value: string;
  label: string;
}

const PROFESSIONAL_TYPES: ProfessionalTypeOption[] = [
  { value: 'terapeuta', label: 'Terapeuta' },
  { value: 'coach', label: 'Coach' },
  { value: 'yoga', label: 'Profe de yoga' },
  { value: 'acupunturista', label: 'Acupunturista' },
  { value: 'constelaciones', label: 'Facilitador/a de constelaciones' },
  { value: 'fisio', label: 'Fisioterapeuta' },
  { value: 'arteterapeuta', label: 'Arteterapeuta' },
  { value: 'respiracion', label: 'Respiración / Breathwork' },
  { value: 'talleres', label: 'Talleres / Retiros' },
  { value: 'masaje', label: 'Masajista / Terapeuta corporal' },
  { value: 'nutricion', label: 'Nutricionista / Dietista' },
  { value: 'meditacion', label: 'Meditación / Mindfulness' },
  { value: 'sonido', label: 'Sound Healing / Baños de sonido' },
  { value: 'psicoterapia', label: 'Psicoterapeuta' },
  { value: 'espacio', label: 'Gestiono un espacio de bienestar' },
  { value: 'otro', label: 'Otra disciplina de bienestar' },
];

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

  readonly professionalTypes = PROFESSIONAL_TYPES;

  activeTab = signal<AccountType>('usuario');
  currentView = signal<ViewType>('login');
  registerStep = signal<RegisterStep>('role-selection');

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  firstName = signal('');
  lastName = signal('');
  city = signal('');
  professionalType = signal<string | null>(null);
  organizationName = signal('');

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

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
    this.city.set('');
    this.professionalType.set(null);
    this.organizationName.set('');
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
    if (!this.firstName() || !this.email() || !this.password() || !this.confirmPassword()) return;

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const generatedUsername = this.email().split('@')[0] + Math.floor(100 + Math.random() * 900);

    this.authService.register({
      username: generatedUsername,
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
        this.errorMessage.set('Error al registrar la cuenta. El email ya está en uso.');
        console.error(err);
      }
    });
  }

  onProfessionalLeadSubmit(): void {
    this.router.navigate(['/circulo-oona']);
  }

  professionalTypeLabel(): string {
    const found = PROFESSIONAL_TYPES.find(t => t.value === this.professionalType());
    return found ? found.label : '';
  }

  selectProfessionalType(type: string): void {
    this.professionalType.set(type);
    this.router.navigate(['/circulo-oona']);
  }

  onGoogleLogin(): void {
    this.router.navigate(['/circulo-oona']);
    return;

    if (this.registerStep() === 'professional-google') {
      this.registerStep.set('professional-form');
      return;
    }
    console.info('Google login — pendiente de integración');
  }

  onProfessionalFormSubmit(): void {
    this.router.navigate(['/circulo-oona']);
  }
}
