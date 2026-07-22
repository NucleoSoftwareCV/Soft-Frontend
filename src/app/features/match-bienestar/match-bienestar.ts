import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommunityService } from '../../services/community.service';
import { EventosService } from '../../services/eventos.service';
import { CategoryResponse } from '../../shared/models/evento.model';
import { MatchRequestUpsertRequest } from '../../shared/models/match-bienestar.model';

@Component({
  selector: 'app-match-bienestar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './match-bienestar.html',
  styleUrls: ['./match-bienestar.css']
})
export class MatchBienestarComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly communityService = inject(CommunityService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);

  // Form Fields
  readonly name = signal('');
  readonly age = signal<number | null>(null);
  readonly email = signal('');
  readonly whatsapp = signal('');
  readonly exactZone = signal('');
  readonly selectedGender = signal<string>(''); // 'MUJER' | 'HOMBRE' | 'OTRA_IDENTIDAD'
  readonly selectedLanguages = signal<Set<string>>(new Set(['ESPANOL']));
  readonly selectedCategories = signal<Set<number>>(new Set());
  readonly selectedDays = signal<Set<string>>(new Set());
  readonly expectations = signal('');
  readonly selectedDescriptors = signal<Set<string>>(new Set());

  // UI State
  readonly categories = signal<CategoryResponse[]>([]);
  readonly loadingCategories = signal(true);
  readonly loadingSubmit = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly successMessage = signal('¡Gracias por participar! Más adelante te enviaremos por WhatsApp la información de tu match.');

  // Gender options
  readonly genderOptions = [
    { value: 'MUJER', label: 'Mujer' },
    { value: 'HOMBRE', label: 'Hombre' },
    { value: 'OTRA_IDENTIDAD', label: 'Otra identidad de género' }
  ];

  // Language options
  readonly languageOptions = [
    { value: 'ESPANOL', label: 'Español' },
    { value: 'INGLES', label: 'English' }
  ];

  // Day options
  readonly dayOptions = [
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIERCOLES', label: 'Miércoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SABADO', label: 'Sábado' },
    { value: 'DOMINGO', label: 'Domingo' }
  ];

  // Descriptor options
  readonly descriptorOptions = [
    { value: 'EMPRENDEDOR', label: 'Emprendedora / emprendedor', icon: '🚀' },
    { value: 'EMBARAZADA', label: 'Estoy embarazada', icon: '🤰' },
    { value: 'PROFESIONAL_BIENESTAR', label: 'Profesional del bienestar', icon: '🌿' }
  ];

  ngOnInit(): void {
    // Si el usuario está autenticado, precargamos su información
    if (this.authService.isLoggedIn) {
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        this.name.set(currentUser.username || '');
        this.email.set(currentUser.email || '');
      }
    }

    this.loadCategories();
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.eventosService.getCategorias().subscribe({
      next: (cats) => {
        // Filtrar solo categorías activas
        this.categories.set(cats.filter(c => c.active));
        this.loadingCategories.set(false);
      },
      error: (err) => {
        console.error('Error al cargar categorías para el match:', err);
        this.loadingCategories.set(false);
      }
    });
  }

  // Toggle Methods
  selectGender(gender: string): void {
    this.selectedGender.set(gender);
  }

  toggleLanguage(lang: string): void {
    const set = new Set(this.selectedLanguages());
    if (set.has(lang)) {
      set.delete(lang);
    } else {
      set.add(lang);
    }
    this.selectedLanguages.set(set);
  }

  toggleCategory(id: number): void {
    const set = new Set(this.selectedCategories());
    if (set.has(id)) {
      set.delete(id);
    } else {
      // Limitar a máximo 3
      if (set.size < 3) {
        set.add(id);
      }
    }
    this.selectedCategories.set(set);
  }

  toggleDay(day: string): void {
    const set = new Set(this.selectedDays());
    if (set.has(day)) {
      set.delete(day);
    } else {
      set.add(day);
    }
    this.selectedDays.set(set);
  }

  toggleDescriptor(desc: string): void {
    const set = new Set(this.selectedDescriptors());
    if (set.has(desc)) {
      set.delete(desc);
    } else {
      // Limitar a máximo 3
      if (set.size < 3) {
        set.add(desc);
      }
    }
    this.selectedDescriptors.set(set);
  }

  // Helper to map category names to emojis
  getCategoryIcon(name: string): string {
    const norm = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (norm.includes('yoga')) return '🧘';
    if (norm.includes('pilates')) return '🤸';
    if (norm.includes('hielo') || norm.includes('breathwork')) return '🧊';
    if (norm.includes('arte') || norm.includes('creatividad')) return '🎨';
    if (norm.includes('movimiento')) return '🏃';
    if (norm.includes('deporte')) return '💪';
    if (norm.includes('meditacion') || norm.includes('mindfulness')) return '🧠';
    if (norm.includes('sonido') || norm.includes('vibracion')) return '🎵';
    if (norm.includes('espiritualidad') || norm.includes('energia')) return '✨';
    if (norm.includes('nutricion') || norm.includes('cocina')) return '🍲';
    if (norm.includes('psicologia')) return '🌱';
    if (norm.includes('cuerpo') || norm.includes('salud')) return '💆';
    if (norm.includes('maternidad') || norm.includes('familia')) return '🤱';
    if (norm.includes('emprendimiento')) return '🚀';
    return '✨';
  }

  // Form Validation
  isFormValid(): boolean {
    return (
      this.name().trim().length > 0 &&
      this.age() !== null && this.age()! >= 18 && this.age()! <= 120 &&
      this.email().trim().length > 0 &&
      this.whatsapp().trim().length > 0 &&
      this.exactZone().trim().length > 0 &&
      this.selectedGender() !== '' &&
      this.selectedLanguages().size > 0 &&
      this.selectedCategories().size > 0 && this.selectedCategories().size <= 3 &&
      this.selectedDays().size > 0 &&
      this.expectations().trim().length > 0
    );
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.loadingSubmit()) return;

    this.loadingSubmit.set(true);
    this.submitError.set(null);

    const payload: MatchRequestUpsertRequest = {
      name: this.name().trim(),
      age: this.age()!,
      email: this.email().trim(),
      whatsapp: this.whatsapp().trim(),
      exactZone: this.exactZone().trim(),
      gender: this.selectedGender(),
      languages: Array.from(this.selectedLanguages()),
      categoryIds: Array.from(this.selectedCategories()),
      availableDays: Array.from(this.selectedDays()),
      expectations: this.expectations().trim(),
      descriptors: Array.from(this.selectedDescriptors())
    };

    this.communityService.upsertMatchRequest(payload).subscribe({
      next: (res) => {
        this.loadingSubmit.set(false);
        this.submitSuccess.set(true);
        if (res && res.message) {
          this.successMessage.set(res.message);
        }
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        console.error('Error al registrar match request:', err);
        if (err.status === 401) {
          this.submitError.set('Tu sesión ha expirado o no estás autenticado. Por favor, vuelve a iniciar sesión.');
        } else {
          this.submitError.set(
            err.error?.detail || 
            err.error?.message || 
            'Ha ocurrido un error al registrar tu participación. Por favor, revisa tus datos e inténtalo de nuevo.'
          );
        }
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
