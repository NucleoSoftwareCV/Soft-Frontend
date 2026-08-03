import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { EventosService } from '../../services/eventos.service';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import { CityResponse } from '../../shared/models/evento.model';
import {
  PROFESSIONAL_TYPE_OPTIONS,
  ProfessionalApplicationRequest,
  ProfessionalApplicationResponse,
  ProfessionalType,
} from '../../shared/models/professional-application.model';

@Component({
  selector: 'app-circulo-oona',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './circulo-oona.component.html',
  styleUrl: './circulo-oona.component.css',
})
export class CirculoOonaComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ProfessionalApplicationService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);

  readonly professionalTypes = PROFESSIONAL_TYPE_OPTIONS;
  readonly currentUser = this.authService.currentUser;
  readonly application = signal<ProfessionalApplicationResponse | null>(null);
  readonly cities = signal<CityResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly justSaved = signal(false);

  private errorTimeout?: ReturnType<typeof setTimeout>;
  private successTimeout?: ReturnType<typeof setTimeout>;
  private justSavedTimeout?: ReturnType<typeof setTimeout>;

  fullName = '';
  cityId: number | null = null;
  professionalType: ProfessionalType | null = null;
  whatsappPhone = '';
  motivation = '';
  privacyAccepted = false;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) return;

    this.fullName = this.currentUser()?.username ?? '';
    this.loadCities();
    this.loadApplication();
  }

  submit(): void {
    if (
      !this.fullName.trim() ||
      !this.cityId ||
      !this.professionalType ||
      !this.whatsappPhone.trim() ||
      !this.motivation.trim() ||
      !this.privacyAccepted
    ) {
      this.showError('Completa todos los campos y acepta la politica de privacidad.');
      return;
    }

    const request: ProfessionalApplicationRequest = {
      fullName: this.fullName.trim(),
      cityId: this.cityId,
      professionalType: this.professionalType,
      whatsappPhone: this.whatsappPhone.trim(),
      motivation: this.motivation.trim(),
      privacyAccepted: this.privacyAccepted,
    };

    this.submitting.set(true);
    this.dismissError();
    this.dismissSuccess();
    this.applicationService.saveMine(request).subscribe({
      next: application => {
        this.application.set(application);
        this.populateForm(application);
        this.showSuccess('Tu solicitud se ha enviado correctamente.');
        this.submitting.set(false);

        this.justSaved.set(true);
        clearTimeout(this.justSavedTimeout);
        this.justSavedTimeout = setTimeout(() => this.justSaved.set(false), 2200);
      },
      error: error => {
        this.showError(this.readError(error, 'No se pudo guardar la solicitud.'));
        this.submitting.set(false);
      },
    });
  }

  /** Deja escribir solo digitos (y un "+" inicial opcional), limitando a 15 digitos (formato E.164). */
  onWhatsappChange(value: string): void {
    const raw = value ?? '';
    const hasPlus = raw.trim().startsWith('+');
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    this.whatsappPhone = (hasPlus ? '+' : '') + digits;
  }

  private showError(message: string): void {
    clearTimeout(this.errorTimeout);
    this.error.set(message);
    this.errorTimeout = setTimeout(() => this.error.set(null), 5000);
  }

  private showSuccess(message: string): void {
    clearTimeout(this.successTimeout);
    this.success.set(message);
    this.successTimeout = setTimeout(() => this.success.set(null), 4000);
  }

  dismissError(): void {
    clearTimeout(this.errorTimeout);
    this.error.set(null);
  }

  dismissSuccess(): void {
    clearTimeout(this.successTimeout);
    this.success.set(null);
  }

  activateProfessionalAccess(): void {
    this.submitting.set(true);
    this.dismissError();
    this.authService.refreshToken().subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/perfil']);
      },
      error: error => {
        this.showError(this.readError(error, 'No se pudo actualizar tu sesion.'));
        this.submitting.set(false);
      },
    });
  }

  private loadCities(): void {
    this.eventosService.getCiudades().subscribe({
      next: cities => this.cities.set(cities.filter(city => city.active)),
      error: () => this.error.set('No se pudieron cargar las ciudades.'),
    });
  }

  private loadApplication(): void {
    this.loading.set(true);
    this.applicationService.getMine().subscribe({
      next: application => {
        this.application.set(application);
        this.populateForm(application);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status !== 404) {
          this.error.set(this.readError(error, 'No se pudo consultar tu solicitud.'));
        }
        this.loading.set(false);
      },
    });
  }

  private populateForm(application: ProfessionalApplicationResponse): void {
    this.fullName = application.fullName;
    this.cityId = application.cityId;
    this.professionalType = application.professionalType;
    this.whatsappPhone = application.whatsappPhone;
    this.motivation = application.motivation;
    this.privacyAccepted = true;
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? fallback;
    }
    return fallback;
  }
}
