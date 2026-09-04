import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfessionalApplicationService } from '../../services/professional-application.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ProfessionalApplicationRequest,
  ProfessionalType
} from '../../shared/models/professional-application.model';

@Component({
  selector: 'app-circulo-oona',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './circulo-oona.component.html',
  styleUrl: './circulo-oona.component.css'
})
export class CirculoOonaComponent {

  private readonly professionalApplicationService =
    inject(ProfessionalApplicationService);

  private readonly auth =
    inject(AuthService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  fullName = '';
  city = '';
  professionalType: ProfessionalType | '' = '';
  whatsapp = '';
  reason = '';
  email = '';
  professional = false;

  private errorTimeout?: ReturnType<typeof setTimeout>;

  submit(): void {
    this.dismissError();
    this.dismissSuccess();

    if (!this.auth.isLoggedIn) {
      this.showError(
        'Primero debes iniciar sesión para enviar tu solicitud.'
      );
      return;
    }

    const fullName = this.fullName.trim();

    if (!fullName) {
      this.showError(
        'Indica tu nombre para poder registrar tu solicitud.'
      );
      return;
    }

    const city = this.city.trim();

    if (!city) {
      this.showError(
        'Indica la ciudad donde realizas tus actividades.'
      );
      return;
    }

    const email = this.email.trim().toLowerCase();

    if (!email) {
      this.showError(
        'Indica tu email para poder contactarte.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      this.showError(
        'Introduce un email válido.'
      );
      return;
    }

    if (!this.professional) {
      this.showError(
        'Debes confirmar que eres profesional del bienestar para continuar.'
      );
      return;
    }

    if (!this.professionalType) {
      this.showError(
        'Indica tu tipo de profesional.'
      );
      return;
    }

    const whatsappPhone = this.whatsapp.trim();

    if (!whatsappPhone) {
      this.showError(
        'Indica tu número de WhatsApp.'
      );
      return;
    }

    const motivation = this.reason.trim();

    if (!motivation) {
      this.showError(
        'Indica el motivo de tu solicitud.'
      );
      return;
    }

    const request: ProfessionalApplicationRequest = {
      fullName,
      city,
      email,
      professionalType: this.professionalType,
      whatsappPhone,
      motivation
    };

    this.submitting.set(true);

    this.professionalApplicationService
      .createApplication(request)
      .subscribe({
        next: () => {
          this.submitting.set(false);

          this.showSuccess(
            '¡Gracias! Tu solicitud ha sido enviada y quedó pendiente de revisión.'
          );

          this.fullName = '';
          this.city = '';
          this.email = '';
          this.professionalType = '';
          this.whatsapp = '';
          this.reason = '';
          this.professional = false;
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);

          this.showError(
            this.readError(
              error,
              'No se pudo enviar la solicitud. Inténtalo nuevamente.'
            )
          );
        }
      });
  }

  private showError(message: string): void {
    clearTimeout(this.errorTimeout);

    this.error.set(message);

    this.errorTimeout = setTimeout(() => {
      this.error.set(null);
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.success.set(message);
  }

  dismissError(): void {
    clearTimeout(this.errorTimeout);
    this.error.set(null);
  }

  dismissSuccess(): void {
    this.success.set(null);
  }

  private readError(
    error: HttpErrorResponse,
    fallback: string
  ): string {

    if (
      error.error &&
      typeof error.error === 'object'
    ) {
      if (error.error.message) {
        return error.error.message;
      }

      if (error.error.detail) {
        return error.error.detail;
      }
    }

    if (
      error.error &&
      typeof error.error === 'string'
    ) {
      return error.error;
    }

    return fallback;
  }
}