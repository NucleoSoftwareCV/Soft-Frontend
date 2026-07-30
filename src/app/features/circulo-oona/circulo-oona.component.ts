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
      this.error.set('Completa todos los campos y acepta la politica de privacidad.');
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
    this.error.set(null);
    this.success.set(null);
    this.applicationService.saveMine(request).subscribe({
      next: application => {
        this.application.set(application);
        this.populateForm(application);
        this.success.set('Tu solicitud se ha enviado correctamente.');
        this.submitting.set(false);
      },
      error: error => {
        this.error.set(this.readError(error, 'No se pudo guardar la solicitud.'));
        this.submitting.set(false);
      },
    });
  }

  activateProfessionalAccess(): void {
    this.submitting.set(true);
    this.error.set(null);
    this.authService.refreshToken().subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/perfil']);
      },
      error: error => {
        this.error.set(this.readError(error, 'No se pudo actualizar tu sesion.'));
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
