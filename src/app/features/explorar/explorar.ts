import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienciasService } from '../../services/experiencias';
import { FiltrosService } from '../../services/filtros.service';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar {
  private experienciasService = inject(ExperienciasService);
  private filtrosService = inject(FiltrosService);

  allExperiencias = this.experienciasService.getExperiencias();

  get filterWhen()       { return this.filtrosService.filterWhen; }
  get filterCategories() { return this.filtrosService.filterCategories; }
  get filterTypes()      { return this.filtrosService.filterTypes; }
  get filterCity()       { return this.filtrosService.filterCity; }
  get filterTimeOfDay()  { return this.filtrosService.filterTimeOfDay; }
  get filterModality()   { return this.filtrosService.filterModality; }
  get filterRecurrence() { return this.filtrosService.filterRecurrence; }
  get activeFilterCount(): number { return this.filtrosService.activeFilterCount; }

  get categoriaOptions(): string[] {
    const cats = new Set(this.allExperiencias.map(e => e.categoria));
    return Array.from(cats).filter(Boolean);
  }

  experienciasFiltradas = computed(() => {
    let items = [...this.allExperiencias];

    const when = this.filterWhen();
    if (when) {
      const lower = when.toLowerCase();
      items = items.filter(e => {
        const f = (e.fecha || '').toLowerCase();
        if (lower === 'hoy') return f.includes('hoy');
        if (lower === 'mañana') return f.includes('mañana');
        if (lower === 'este finde') return f.includes('sábado') || f.includes('domingo');
        if (lower === 'esta semana') return true;
        if (lower === 'próxima semana' || lower === 'proxima semana') return true;
        return true;
      });
    }

    const cats = this.filterCategories();
    if (cats.length > 0) {
      items = items.filter(e => cats.includes(e.categoria));
    }

    const city = this.filterCity();
    if (city && city !== 'Todas') {
      items = items.filter(e =>
        (e.ciudad || e.lugar || '').toLowerCase().includes(city.toLowerCase())
      );
    }

    const time = this.filterTimeOfDay();
    if (time) {
      items = items.filter(e => {
        const hora = (e.horaDetalle || e.fecha || '').toLowerCase();
        if (time === 'Mañana') return /6h|7h|8h|9h|10h|11h|12h/.test(hora);
        if (time === 'Mediodía') return /12h|13h|14h|15h|16h/.test(hora);
        if (time === 'Tarde') return /16h|17h|18h|19h|20h/.test(hora);
        if (time === 'Noche') return /20h|21h|22h|23h|24h/.test(hora);
        return true;
      });
    }

    const modality = this.filterModality();
    if (modality) {
      items = items.filter(e =>
        (e.modalidad || '').toLowerCase() === modality.toLowerCase()
      );
    }

    const recurrence = this.filterRecurrence();
    if (recurrence) {
      if (recurrence === 'Recurrente') {
        items = items.filter(e => (e.fecha || '').toLowerCase().includes('semanal'));
      } else {
        items = items.filter(e => !(e.fecha || '').toLowerCase().includes('semanal'));
      }
    }

    return items;
  });

  openHeaderFilter() {
    window.dispatchEvent(new CustomEvent('oona:open-filter'));
  }

  selectWhen(option: string) {
    this.filtrosService.selectWhen(option);
    window.dispatchEvent(new CustomEvent('oona:select-when', { detail: option }));
  }

  toggleCategoria(cat: string) {
    this.filtrosService.toggleCategory(cat);
  }

  clearFilters() {
    this.filtrosService.clearFilters();
  }

  toggleFavorito(item: any) {
    item.favorito = !item.favorito;
  }
}
