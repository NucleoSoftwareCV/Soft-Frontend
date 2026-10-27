import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap, timer } from 'rxjs';
import { FiltrosEstado, FiltrosService } from '../../../services/filtros.service';
import {
  SpecialistProfileResponse, SpecialistProfileService,
} from '../../../services/profesionales.service';

type ProfessionalOption = Pick<SpecialistProfileResponse, 'id' | 'publicName'>;

@Component({
  selector: 'app-advanced-event-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="advanced-filters" aria-labelledby="advanced-filters-title">
      <header class="filters-heading">
        <h2 id="advanced-filters-title">Filtros avanzados</h2>
        <button type="button" class="clear-link" (click)="clear()">Limpiar</button>
      </header>
      <button type="button" class="mobile-filter-toggle"
        [attr.aria-expanded]="expanded()" aria-controls="advanced-filter-form"
        (click)="expanded.update(toggle)">
        {{ expanded() ? 'Ocultar filtros' : 'Mostrar filtros' }}
        @if (filters.activeFilterCount) { <span>{{ filters.activeFilterCount }}</span> }
      </button>

      <form id="advanced-filter-form" class="filter-form" [class.filter-form--expanded]="expanded()"
        (submit)="apply($event)" novalidate>
        <fieldset>
          <legend>Tipo de práctica</legend>
          <div class="category-chips">
            <button type="button" class="filter-chip" [class.selected]="!draft().categories.length"
              [attr.aria-pressed]="!draft().categories.length" (click)="set('categories', [])">Todas</button>
            @for (category of filters.categories(); track category.id) {
              <button type="button" class="filter-chip"
                [class.selected]="draft().categories.includes(category.name)"
                [attr.aria-pressed]="draft().categories.includes(category.name)"
                (click)="toggleCategory(category.name)">{{ category.name }}</button>
            }
          </div>
        </fieldset>

        <label class="field-label" for="advanced-experience">Tipo de experiencia</label>
        <select id="advanced-experience" [value]="draft().types[0] || ''"
          (change)="set('types', $any($event.target).value ? [$any($event.target).value] : [])">
          <option value="">Todos los tipos</option>
          @for (type of filters.experienceTypes(); track type.id) {
            <option [value]="type.name">{{ type.name }}</option>
          }
        </select>

        <label class="field-label" for="advanced-city">Ciudad</label>
        <select id="advanced-city" [value]="draft().city"
          (change)="set('city', $any($event.target).value)">
          <option value="Todas">Todas las ciudades</option>
          @for (city of filters.cities(); track city.id) {
            <option [value]="city.name">{{ city.name }}</option>
          }
        </select>

        <label class="field-label" for="advanced-date">Cuándo</label>
        <select id="advanced-date" [value]="dateChoice()"
          (change)="chooseDate($any($event.target).value)">
          <option value="">Cualquier fecha</option>
          @for (when of filters.whenOptions; track when) { <option [value]="when">{{ when }}</option> }
          <option value="CUSTOM">Elegir un rango</option>
        </select>
        @if (dateChoice() === 'CUSTOM') {
          <div class="date-fields">
            <label for="advanced-date-from">Desde</label>
            <input id="advanced-date-from" type="date" [value]="dateFrom()"
              (input)="setDate('from', $any($event.target).value)">
            <label for="advanced-date-to">Hasta</label>
            <input id="advanced-date-to" type="date" [value]="dateTo()" [min]="dateFrom()"
              (input)="setDate('to', $any($event.target).value)">
          </div>
        }

        <label class="field-label price-heading" for="advanced-price">
          Precio máximo <output for="advanced-price">{{ maxPrice() === null ? 'Sin límite' : maxPrice() + ' €' }}</output>
        </label>
        <input id="advanced-price" type="range" min="0" [max]="sliderMax()" step="5"
          [value]="maxPrice() ?? 250"
          [attr.aria-valuetext]="maxPrice() === null ? 'Sin límite' : maxPrice() + ' euros'"
          (input)="set('price', 'MAX:' + $any($event.target).value)">
        <button type="button" class="clear-price" (click)="set('price', null)">Sin límite de precio</button>
        @if (minPrice() !== null) { <small>Precio mínimo aplicado: {{ minPrice() }} €</small> }

        <label class="field-label" for="advanced-modality">Modalidad</label>
        <select id="advanced-modality" [value]="draft().modality ?? ''"
          (change)="set('modality', $any($event.target).value || null)">
          <option value="">Todas las modalidades</option>
          @for (modality of filters.modalityOptions; track modality) {
            <option [value]="modality">{{ modality }}</option>
          }
        </select>

        <label class="field-label" for="advanced-time">Horario</label>
        <select id="advanced-time" [value]="draft().timeOfDay ?? ''"
          (change)="set('timeOfDay', $any($event.target).value || null)">
          <option value="">Cualquier horario</option>
          @for (time of filters.timeOptions; track time.label) {
            <option [value]="time.label">{{ time.label }} · {{ time.sub }}</option>
          }
        </select>

        <label class="field-label" for="advanced-recurrence">Frecuencia</label>
        <select id="advanced-recurrence" [value]="draft().recurrence ?? ''"
          (change)="set('recurrence', $any($event.target).value || null)">
          <option value="">Todos los eventos</option>
          @for (recurrence of filters.recurrenceOptions; track recurrence) {
            <option [value]="recurrence">{{ recurrence }}</option>
          }
        </select>

        <label class="field-label" for="advanced-professional">Profesional</label>
        <input id="advanced-professional" type="search" placeholder="Buscar por nombre…"
          autocomplete="off" [value]="professionalQuery()"
          (input)="onProfessionalInput($any($event.target).value)">
        @if (professionalLoading()) { <small role="status">Buscando profesionales…</small> }
        @if (professionalError()) { <small role="status">{{ professionalError() }}</small> }
        @if (professionals().length) {
          <ul class="professional-options" aria-label="Profesionales encontrados">
            @for (person of professionals(); track person.id) {
              <li><button type="button" (click)="selectProfessional(person)">{{ person.publicName }}</button></li>
            }
          </ul>
        }
        @if (draft().specialistId || professionalQuery()) {
          <button type="button" class="clear-price" (click)="onProfessionalInput('')">Quitar profesional</button>
        }

        <footer>
          @if (submitted() && validationError()) { <p class="validation-error" role="alert">{{ validationError() }}</p> }
          <button type="submit" class="apply-filters">Aplicar filtros</button>
        </footer>
      </form>
    </aside>
  `,
  styleUrl: './advanced-event-filters.component.css',
})
export class AdvancedEventFiltersComponent {
  readonly filters = inject(FiltrosService);
  private readonly api = inject(SpecialistProfileService);
  private readonly destroyRef = inject(DestroyRef);
  readonly expanded = signal(false);
  readonly toggle = (value: boolean) => !value;
  readonly draft = signal<FiltrosEstado>(this.filters.snapshot());
  readonly professionalQuery = signal(this.draft().specialistName ?? '');
  readonly professionals = signal<ProfessionalOption[]>([]);
  readonly professionalLoading = signal(false);
  readonly professionalError = signal<string | null>(null);
  readonly submitted = signal(false);
  private readonly professionalInput$ = new Subject<string>();
  private lastSnapshotKey = '';

  readonly dateChoice = computed(() => this.draft().when?.startsWith('RANGO:') ? 'CUSTOM' : this.draft().when ?? '');
  readonly dateFrom = computed(() => this.draft().when?.startsWith('RANGO:') ? this.draft().when!.split(':')[1] : '');
  readonly dateTo = computed(() => this.draft().when?.startsWith('RANGO:') ? this.draft().when!.split(':')[2] : '');
  readonly maxPrice = computed(() => this.filters.priceRangeFor(this.draft().price).maxPrice ?? null);
  readonly minPrice = computed(() => this.filters.priceRangeFor(this.draft().price).minPrice ?? null);
  readonly sliderMax = computed(() => Math.max(500, this.maxPrice() ?? 0));
  readonly validationError = computed(() => {
    if (this.dateChoice() === 'CUSTOM' &&
        (!this.dateFrom() || !this.dateTo() || this.dateTo() < this.dateFrom())) {
      return 'Selecciona un rango de fechas válido.';
    }
    if (this.professionalQuery().trim() && this.draft().specialistId == null) {
      return 'Selecciona un profesional de la lista o borra su nombre.';
    }
    return null;
  });

  constructor() {
    effect(() => {
      const snapshot = this.filters.snapshot();
      const key = JSON.stringify(snapshot);
      if (key !== this.lastSnapshotKey) {
        this.lastSnapshotKey = key;
        untracked(() => {
          this.draft.set(snapshot);
          this.professionalQuery.set(snapshot.specialistName ?? '');
          this.submitted.set(false);
          this.professionalInput$.next('');
        });
      }
    });

    this.professionalInput$.pipe(
      switchMap(value => {
        this.professionals.set([]);
        this.professionalError.set(null);
        const query = value.trim();
        if (query.length < 2) {
          this.professionalLoading.set(false);
          return of([]);
        }
        this.professionalLoading.set(true);
        return timer(300).pipe(
          switchMap(() => this.api.getPublicProfiles(undefined, query, 6)),
          map(page => {
            if (!page.content.length) this.professionalError.set('No se encontraron profesionales.');
            return page.content;
          }),
          catchError(() => {
            this.professionalError.set('No pudimos buscar profesionales. Inténtalo otra vez.');
            return of([]);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(options => {
      this.professionals.set(options);
      this.professionalLoading.set(false);
    });
  }

  set<K extends keyof FiltrosEstado>(key: K, value: FiltrosEstado[K]): void {
    this.draft.update(state => ({ ...state, [key]: value }));
  }

  toggleCategory(name: string): void {
    this.draft.update(state => ({
      ...state,
      categories: state.categories.includes(name)
        ? state.categories.filter(category => category !== name)
        : [...state.categories, name],
    }));
  }

  chooseDate(value: string): void {
    this.set('when', value === 'CUSTOM' ? 'RANGO::' : value || null);
  }

  setDate(side: 'from' | 'to', value: string): void {
    const from = side === 'from' ? value : this.dateFrom();
    const to = side === 'to' ? value : this.dateTo() || value;
    this.set('when', 'RANGO:' + from + ':' + to);
  }

  onProfessionalInput(value: string): void {
    this.professionalQuery.set(value);
    this.draft.update(state => ({ ...state, specialistId: null, specialistName: null }));
    this.professionalInput$.next(value);
  }

  selectProfessional(person: ProfessionalOption): void {
    this.professionalInput$.next('');
    this.professionalQuery.set(person.publicName);
    this.draft.update(state => ({ ...state, specialistId: person.id, specialistName: person.publicName }));
  }

  apply(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);
    if (this.validationError()) return;
    this.filters.applySnapshot(this.draft());
    this.expanded.set(false);
  }

  clear(): void {
    this.filters.clearFilters();
    this.draft.set(this.filters.snapshot());
    this.professionalQuery.set('');
    this.professionalInput$.next('');
    this.submitted.set(false);
  }
}
