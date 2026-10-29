import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventTravel } from '../../models/event-travel.model';
import { EventTravelService } from '../../../services/event-travel.service';

@Component({
  selector: 'app-location-notice',
  standalone: true,
  imports: [RouterLink],
  template: `@if (travel.eligible()) {
    @if (travel.loaded() && !travel.loadError() && !travel.location()) {
      <p class="notice" role="status">Añade tu ubicación en Preferencias para conocer la distancia y el tiempo de viaje hasta los eventos.
        <a routerLink="/preferencias">Ir a Preferencias</a></p>
    } @else if (travel.loadError()) {
      <p class="notice" role="status">No pudimos recuperar tu ubicación.
        <button type="button" (click)="travel.retry()">Reintentar</button></p>
    }
  }`,
  styles: [`.notice { padding:14px 16px; background:#edf5f2; border:1px solid #d5e5df; border-radius:12px; color:#28525a; line-height:1.6; }
    a,button { color:#00545d; font-weight:600; margin-left:6px; } button { background:none; border:0; text-decoration:underline; cursor:pointer; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationNoticeComponent { readonly travel = inject(EventTravelService); }

@Component({
  selector: 'app-event-travel',
  standalone: true,
  imports: [RouterLink, LocationNoticeComponent],
  template: `@if (modality() !== 'ONLINE') {
    @if (detail()) {
      <div class="travel travel--detail">
        <h3>Tu desplazamiento</h3><app-location-notice />
        @if (travel.eligible() && travel.location()) {
          @if (result(); as value) {
            @if (value.status === 'AVAILABLE' && value.distanceKm !== null) {
              <p class="origin">Desde {{ travel.location()?.label }}</p>
              <p class="metrics"><strong>{{ distance(value.distanceKm) }} km</strong>
                <span>{{ value.method === 'ROUTE' ? 'por carretera' : 'en línea recta' }}</span></p>
              @if (value.durationMinutes !== null) {
                <p class="time">{{ duration(value.durationMinutes) }} · En coche</p>
              } @else { <p class="time">Tiempo de viaje no disponible</p> }
              @if (value.approximate) { <small>Ubicación aproximada · trayecto orientativo</small> }
              @if (value.method === 'ROUTE') { <small>Estimación sin tráfico en tiempo real.</small> }
              @if (value.directionsUrl) {
                <a class="route" [href]="value.directionsUrl" target="_blank" rel="noopener noreferrer">
                  {{ value.approximate ? 'Ver ruta orientativa' : 'Cómo llegar' }} ↗
                </a>
                <small>Al abrir la ruta, compartirás estos puntos con Google Maps.</small>
              }
              <a routerLink="/preferencias">Cambiar mi ubicación</a>
            } @else { <p>No hay una ubicación válida y disponible para calcular este trayecto.</p> }
            @if (value.status !== 'AVAILABLE' || value.durationMinutes === null) {
              <button type="button" class="retry-route" (click)="travel.retryTravel(occurrenceId())">Reintentar trayecto</button>
            }
          } @else if (occurrenceId()) { <p role="status">Calculando distancia…</p> }
          @else { <p>Selecciona una sesión con ubicación para consultar el trayecto.</p> }
        } @else if (!travel.eligible()) {
          <p>Inicia sesión como cliente y añade tu ubicación en Preferencias para consultar el trayecto.</p>
        }
      </div>
    } @else if (travel.eligible() && travel.location()) {
      @if (result(); as value) {
        @if (value.status === 'AVAILABLE' && value.distanceKm !== null) {
          <div class="travel-compact" [title]="description(value)" [attr.aria-label]="description(value)">
            <span class="travel-compact__part">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              <strong>{{ distance(value.distanceKm) }} km</strong>
            </span>
            @if (value.durationMinutes !== null) {
              <span class="travel-compact__part">
                <span aria-hidden="true">·</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span>{{ shortDuration(value.durationMinutes) }}</span>
              </span>
            } @else { <span class="travel-compact__method">en línea recta</span> }
            @if (value.approximate || value.method === 'ROUTE') {
              <span class="travel-compact__method">aprox.</span>
            }
          </div>
        }
      }
    }
  }`,
  styleUrl: './event-travel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTravelComponent {
  readonly occurrenceId = input<number | null>();
  readonly modality = input<string>();
  readonly detail = input(false);
  readonly travel = inject(EventTravelService);
  readonly result = computed(() => this.travel.result(this.occurrenceId()));
  constructor() {
    effect(onCleanup => {
      const id = this.occurrenceId();
      if (this.modality() === 'ONLINE' || !id || id < 1) return;
      untracked(() => onCleanup(this.travel.watch(id)));
    });
  }
  distance(km: number): string { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km); }
  shortDuration(minutes: number): string {
    if (minutes < 1) return '<1 min';
    const rounded = Math.ceil(minutes);
    return rounded < 60 ? rounded + ' min' :
      Math.floor(rounded / 60) + ' h' + (rounded % 60 ? ' ' + rounded % 60 + ' min' : '');
  }
  description(value: EventTravel): string {
    const distance = this.distance(value.distanceKm ?? 0) + ' km ' +
      (value.method === 'ROUTE' ? 'por carretera' : 'en línea recta');
    const time = value.durationMinutes === null ? 'Tiempo de viaje no disponible' :
      this.duration(value.durationMinutes) + ' en coche, sin tráfico en tiempo real';
    return [value.address, value.cityName, distance, time,
      value.approximate ? 'Ubicación aproximada; confirmar sede con el organizador.' : ''].filter(Boolean).join(' · ');
  }
  duration(minutes: number): string {
    if (minutes < 1) return 'Menos de 1 min aprox.';
    const rounded = Math.ceil(minutes);
    return rounded < 60 ? rounded + ' min aprox.' :
      Math.floor(rounded / 60) + ' h' + (rounded % 60 ? ' ' + rounded % 60 + ' min' : '') + ' aprox.';
  }
}
