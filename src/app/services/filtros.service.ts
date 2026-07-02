import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FiltrosService {
  filterWhen       = signal<string | null>(null);
  filterCategories = signal<string[]>([]);
  filterTypes      = signal<string[]>([]);
  filterCity       = signal<string>('Todas');
  filterTimeOfDay  = signal<string | null>(null);
  filterModality   = signal<string | null>(null);
  filterRecurrence = signal<string | null>(null);

  whenOptions     = ['Hoy', 'Mañana', 'Este finde', 'Esta semana', 'Próxima semana'];
  categoryOptions = [
    'Yoga', 'Hielo y Breathwork', 'Arte y Creatividad', 'Movimiento',
    'Deporte', 'Meditación y Mindfulness', 'Sonido y Vibración',
    'Espiritualidad y Energía', 'Nutrición y Cocina', 'Psicología',
    'Cuerpo y Salud', 'Maternidad y Familia', 'Emprendimiento',
  ];
  typeOptions     = ['Talleres', 'Retiros', 'Clases', 'Ceremonias', 'Encuentros Grupales', 'Formaciones'];
  cityOptions     = ['Todas', 'Valencia', 'Alicante', 'Castellón', 'Barcelona', 'Madrid'];
  timeOptions     = [
    { label: 'Mañana',   sub: '6h – 12h'  },
    { label: 'Mediodía', sub: '12h – 16h' },
    { label: 'Tarde',    sub: '16h – 20h' },
    { label: 'Noche',    sub: '20h – 24h' },
  ];
  modalityOptions   = ['Presencial', 'Online'];
  recurrenceOptions = ['Único', 'Recurrente'];

  get activeFilterCount(): number {
    return (
      (this.filterWhen() ? 1 : 0) +
      this.filterCategories().length +
      this.filterTypes().length +
      (this.filterCity() !== 'Todas' ? 1 : 0) +
      (this.filterTimeOfDay() ? 1 : 0) +
      (this.filterModality() ? 1 : 0) +
      (this.filterRecurrence() ? 1 : 0)
    );
  }

  selectWhen(opt: string): void {
    this.filterWhen.set(this.filterWhen() === opt ? null : opt);
  }

  toggleCategory(cat: string): void {
    const c = this.filterCategories();
    this.filterCategories.set(c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat]);
  }

  toggleType(t: string): void {
    const c = this.filterTypes();
    this.filterTypes.set(c.includes(t) ? c.filter(x => x !== t) : [...c, t]);
  }

  selectCity(city: string): void {
    this.filterCity.set(city);
  }

  selectTimeOfDay(t: string): void {
    this.filterTimeOfDay.set(this.filterTimeOfDay() === t ? null : t);
  }

  selectModality(m: string): void {
    this.filterModality.set(this.filterModality() === m ? null : m);
  }

  selectRecurrence(r: string): void {
    this.filterRecurrence.set(this.filterRecurrence() === r ? null : r);
  }

  clearFilters(): void {
    this.filterWhen.set(null);
    this.filterCategories.set([]);
    this.filterTypes.set([]);
    this.filterCity.set('Todas');
    this.filterTimeOfDay.set(null);
    this.filterModality.set(null);
    this.filterRecurrence.set(null);
  }
}
