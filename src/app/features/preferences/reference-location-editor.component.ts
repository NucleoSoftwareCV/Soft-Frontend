import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventMapComponent } from '../../shared/components/event-map/event-map.component';
import { EventTravelService } from '../../services/event-travel.service';
import { ReferenceLocation } from '../../shared/models/event-travel.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reference-location-editor',
  standalone: true,
  imports: [EventMapComponent],
  template: `<section class="reference-section" aria-labelledby="reference-title">
    <div class="heading"><h2 id="reference-title">Tu ubicación de referencia</h2>
      @if (dirty()) { <span class="unsaved">Cambios sin guardar</span> }
      @else if (travel.location()) { <span>Guardada</span> }</div>
    <p>Indica desde dónde viajarás para consultar la distancia hasta los eventos. Puede ser una dirección o una ciudad de referencia.</p>
    @if (travel.loadError()) {
      <p role="alert">No se pudo recuperar tu ubicación. <button type="button" (click)="travel.retry()">Reintentar</button></p>
    }
    @if (!travel.loaded()) { <p role="status">Recuperando tu ubicación guardada…</p> }
    <label for="reference-label">Dirección o referencia</label>
    <input id="reference-label" maxlength="300" autocomplete="street-address" aria-describedby="reference-help" [disabled]="busy() || !travel.loaded()"
      [value]="label()" (input)="editLabel($any($event.target).value)" placeholder="Por ejemplo, mi barrio o dirección de salida" />
    <p id="reference-help" class="hint">Escribe la referencia y confirma el punto de salida en el mapa. Cambiar el texto no mueve ese punto automáticamente.</p>
    <label class="check"><input type="checkbox" [checked]="approximate()" (change)="approximate.set($any($event.target).checked)" />
      Usar como referencia aproximada de ciudad o barrio</label>
    <button type="button" class="secondary" (click)="mapOpen.set(!mapOpen())">
      {{ mapOpen() ? 'Ocultar mapa' : 'Elegir punto en el mapa' }}
    </button>
    @if (mapOpen()) {
      <p>Haz clic en tu punto de salida o pulsa «Mi ubicación». Puedes ampliar el mapa para precisar el punto.</p>
      <app-event-map [points]="[]" [selectable]="true" [referencePoint]="point()"
        (pointSelected)="selectPoint($event)" label="Seleccionar mi punto de referencia" />
    }
    @if (point()) { <p class="point">Punto seleccionado: {{ coordinates() }}</p> }
    @else { <p>Confirma el punto en el mapa antes de guardar.</p> }
    @if (!label().trim()) { <p class="hint">Falta escribir una dirección, ciudad o referencia.</p> }
    <p class="hint">Usa «Guardar ubicación» para guardar esta sección. El botón general guarda las demás preferencias.</p>
    <div class="actions">
      <button type="button" (click)="save()" [disabled]="busy() || !label().trim() || !point() || !travel.loaded() || travel.loadError()">
        {{ busy() ? 'Guardando…' : 'Guardar ubicación' }}
      </button>
      @if (travel.location()) {
        <button type="button" class="secondary" [disabled]="busy()" (click)="clear()">Eliminar ubicación</button>
      }
    </div>
    @if (message()) { <p class="saved-message" role="status">{{ message() }}</p> }
    @if (error()) { <p role="alert">{{ error() }}</p> }
    <details class="privacy"><summary>Privacidad de tu ubicación</summary>
      <p>Esta referencia es privada. Si se configura un servicio de rutas, se usarán estas coordenadas para calcular el trayecto. Puedes eliminarla cuando quieras.</p>
    </details>
  </section>`,
  styles: [`:host{display:block}.reference-section{border-top:1px solid #dce6df;padding:26px 0;color:#36616a}.heading{display:flex;justify-content:space-between;gap:12px;align-items:center}h2{font-family:Georgia,serif;font-size:24px;color:#004f59;margin:0}.heading span{background:#e5f2df;padding:5px 12px;border-radius:20px;font-size:13px}p{line-height:1.6}.privacy{font-size:13px;color:#64777a}label{display:block;font-weight:600;margin:16px 0 8px}input:not([type=checkbox]){box-sizing:border-box;width:100%;padding:14px;border:1px solid #cddcda;border-radius:12px;color:#004f59;background:white;font:inherit}.check{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:400}.actions{display:flex;gap:12px;flex-wrap:wrap}button{font:inherit;border-radius:10px;border:1px solid #00545d;background:#00545d;color:white;padding:12px 18px;cursor:pointer}button.secondary{background:white;color:#00545d}button:disabled{opacity:.5;cursor:default}.point,.hint{font-size:14px}.saved-message{padding:12px;border-radius:10px;background:#e5f2df;color:#265c2e;font-weight:600}.heading span.unsaved{background:#fff1d6;color:#805b13}details.privacy{margin-top:18px}summary{cursor:pointer}[role=alert]{color:#a42b24}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceLocationEditorComponent {
  readonly travel = inject(EventTravelService);
  private readonly destroyRef = inject(DestroyRef);
  readonly label = signal('');
  readonly approximate = signal(false);
  readonly point = signal<{ latitude: number; longitude: number } | null>(null);
  readonly mapOpen = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly dirty = computed(() => {
    const saved = this.travel.location();
    const point = this.point();
    return this.label().trim() !== (saved?.label ?? '') ||
      (point?.latitude ?? null) !== (saved?.latitude ?? null) ||
      (point?.longitude ?? null) !== (saved?.longitude ?? null) ||
      this.approximate() !== (saved?.approximate ?? false);
  });
  constructor() {
    effect(() => {
      const value = this.travel.location();
      untracked(() => {
        this.label.set(value?.label ?? '');
        this.approximate.set(value?.approximate ?? false);
        this.point.set(value ? { latitude: value.latitude, longitude: value.longitude } : null);
      });
    });
  }
  editLabel(label: string): void {
    this.label.set(label);
    this.message.set('');
    this.error.set('');
  }
  selectPoint(point: { latitude: number; longitude: number }): void {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
        Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) {
      this.error.set('El punto seleccionado no es válido. Elige otro punto en el mapa.');
      return;
    }
    this.point.set(point); this.message.set(''); this.error.set('');
  }
  coordinates(): string {
    const p = this.point();
    return p ? p.latitude.toFixed(5) + ', ' + p.longitude.toFixed(5) : '';
  }
  save(): void {
    const point = this.point();
    if (this.busy()) return;
    if (!this.travel.loaded() || this.travel.loadError()) {
      this.error.set('Primero recupera tu ubicación guardada. Usa Reintentar si aparece un error.');
      return;
    }
    if (!this.label().trim() || !point) {
      this.error.set(!this.label().trim() ? 'Escribe una dirección o referencia.' : 'Confirma tu punto de salida en el mapa.');
      return;
    }
    this.busy.set(true); this.error.set(''); this.message.set('');
    const request: ReferenceLocation = { ...point, label: this.label().trim(), approximate: this.approximate() };
    this.travel.save(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy.set(false); this.message.set('Ubicación guardada. Las distancias se actualizarán con este punto.'); },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(error.status === 401
          ? 'Tu sesión ha caducado. Inicia sesión nuevamente para guardar la ubicación.'
          : error.status === 404
            ? 'El guardado de ubicación no está disponible en el backend. Reinicia Soft-Backend desde IntelliJ y vuelve a intentarlo.'
            : 'No se pudo guardar la ubicación. Conservamos tu selección para que puedas intentarlo de nuevo.');
      },
    });
  }
  clear(): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.travel.clear().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy.set(false); this.message.set('Ubicación eliminada.'); },
      error: () => { this.busy.set(false); this.error.set('No se pudo eliminar la ubicación.'); },
    });
  }
}
