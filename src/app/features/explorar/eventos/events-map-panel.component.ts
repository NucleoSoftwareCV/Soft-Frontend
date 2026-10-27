import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { EventMapService } from '../../../services/event-map.service';
import { EventMapPoint } from '../../../shared/models/event-map.model';
import { EventFilterParams } from '../../../shared/models/evento.model';
import { filterMapPoints } from '../../../shared/models/event-map-filter';
import { EventMapComponent } from '../../../shared/components/event-map/event-map.component';

@Component({
  selector: 'app-events-map-panel',
  standalone: true,
  imports: [EventMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="events-map-panel" [class.events-map-panel--embedded]="embedded()" aria-labelledby="events-map-title">
      <div class="map-panel-heading">
        <div>
          <h2 id="events-map-title">Explora las experiencias en el mapa</h2>

        </div>
        @if (open() && !loading() && !error() && points().length) {
          <p class="map-count"><span>{{ eventCount() }} eventos</span><span>{{ displayPoints().length }} sesiones</span></p>
        }
        @if (!embedded()) {
          <button type="button" class="map-toggle"
            [attr.aria-expanded]="open()" aria-controls="events-map-content"
            (click)="toggle()">
            {{ open() ? 'Cerrar mapa' : 'Ver mapa de eventos' }}
          </button>
        }
      </div>
      @if (open()) {
        <div id="events-map-content">
          @if (loading()) {
            <p role="status">Buscando eventos en el mapa…</p>
          } @else if (error()) {
            <p role="alert">{{ error() }}</p>
            <button type="button" class="map-toggle" (click)="load()">Reintentar</button>
          } @else {
            @if (!points().length) {
              <div class="map-empty" role="status">
                <p>Todavía no hay eventos con coordenadas disponibles. Las ubicaciones necesitan latitud y longitud guardadas para aparecer aquí.</p>
              </div>
            }
            @if (missingMoodData()) {
              <p class="map-empty" role="status">Todavía no hay información de estado de ánimo para estos eventos. Quita ese filtro para ver sus ubicaciones.</p>
            } @else if (points().length && !displayPoints().length) {
              <p class="map-empty" role="status">No hay sesiones que coincidan con estos filtros. Prueba a cambiar o limpiar la selección.</p>
            }
            <app-event-map [points]="displayPoints()" label="Mapa de eventos filtrados" />
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .events-map-panel {
      padding: 20px; border: 1px solid rgba(0,78,89,.14);
      border-radius: 20px; background: #fff;
    }
    .map-panel-heading { display: flex; align-items: center; gap: 24px; justify-content: space-between; margin-bottom: 20px; }
    h2 { margin: 0; color: #004e59; font-family: var(--font-display); font-size: 26px; }
    p { color: #42676e; line-height: 1.6; }
    .map-panel-heading p { margin: 0; }
    .map-toggle {
      flex-shrink: 0; border: 1px solid #004e59; border-radius: 24px;
      padding: 10px 18px; background: #004e59; color: #fff; cursor: pointer;
      font: inherit; min-height: 44px;
    }
    .map-toggle:focus-visible { outline: 3px solid #d4856a; outline-offset: 3px; }
    .map-count { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; font-weight: 600; margin: 0; flex-shrink: 0; }
    .map-count span { border-radius: 20px; padding: 5px 12px; background: #edf5f3; color: #004e59; }
    .map-caption { margin-bottom: 16px; font-size: 14px; }
    .map-empty { padding: 16px; margin-bottom: 20px; border-radius: 12px; background: #f3f6f4; }
    .map-empty p { margin: 0 0 12px; }
    @media(max-width: 639px) {
      .events-map-panel { padding: 20px 14px; }
      .map-panel-heading { align-items: stretch; flex-direction: column; gap: 16px; }
      h2 { font-size: 24px; }
    }
  `],
})
export class EventsMapPanelComponent {
  private readonly api = inject(EventMapService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly embedded = input(false);
  readonly filters = input<EventFilterParams>({});
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly points = signal<EventMapPoint[]>([]);
  readonly displayPoints = computed(() =>
    filterMapPoints(this.points(), this.filters())
  );
  readonly eventCount = computed(() => new Set(this.displayPoints().map(point => point.eventId)).size);
  readonly missingMoodData = computed(() => !!this.filters().mood &&
    this.points().length > 0 && this.points().every(point => !point.mood));

  constructor() {
    effect(() => {
      if (this.embedded()) {
        untracked(() => {
          this.open.set(true);
          this.load();
        });
      }
    });
  }

  toggle(): void {
    this.open.update(value => !value);
    if (this.open()) this.load();
    else {
      this.request?.unsubscribe();
      this.loading.set(false);
    }
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.points.set([]);
    this.request = this.api.getAllPoints()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: points => {
          this.points.set(points);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar los eventos del mapa. Inténtalo nuevamente.');
          this.loading.set(false);
        },
      });
  }
}
