import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, HostListener, effect, inject, input, signal, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { LayerGroup, LocationEvent, ErrorEvent, Map as LeafletMap } from 'leaflet';
import { EventMapPoint, groupMapPoints } from '../../models/event-map.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-frame" [class.map-frame--expanded]="expanded()">
      @if (ready()) {
        <div class="map-toolbar" role="group" aria-label="Herramientas del mapa">
          <button type="button" (click)="fitAll()" [disabled]="!points().length" title="Ver todos los eventos">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 9h6v6H9z"/></svg>
            <span>Ver todos</span>
          </button>
          <button type="button" (click)="locate()" [disabled]="locating()" title="Centrar en mi ubicación">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
            <span>{{ locating() ? 'Localizando…' : 'Mi ubicación' }}</span>
          </button>
          <button type="button" (click)="toggleWheel()" [attr.aria-pressed]="wheelZoom()" title="Activar o desactivar zoom con la rueda">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/></svg>
            <span>Zoom con rueda</span>
          </button>
          <button type="button" (click)="toggleExpanded()" [attr.aria-expanded]="expanded()"
            [title]="expanded() ? 'Reducir mapa' : 'Ampliar mapa'">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>
            <span>{{ expanded() ? 'Reducir' : 'Ampliar' }}</span>
          </button>
        </div>
      }
      <div #canvas class="map-canvas" role="region" tabindex="0"
        [attr.aria-label]="label()"></div>
      @if (!ready() && !error()) {
        <p class="map-status" role="status">Preparando mapa…</p>
      }
    </div>
    @if (locationMessage()) {
      <p class="location-message" role="status">{{ locationMessage() }}</p>
    }
    @if (error()) {
      <p class="map-error" role="alert">{{ error() }}</p>
    }
    @if (tileError()) {
      <p class="map-error" role="status">
        No se pudo cargar parte del mapa. Comprueba tu conexión a internet.
      </p>
    }
  `,
  styleUrl: './event-map.component.css',
})
export class EventMapComponent {
  readonly points = input.required<readonly EventMapPoint[]>();
  readonly label = input('Mapa de eventos');
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);
  readonly tileError = signal(false);
  readonly expanded = signal(false);
  readonly wheelZoom = signal(false);
  readonly locating = signal(false);
  readonly locationMessage = signal<string | null>(null);
  private userLocation: LayerGroup | null = null;

  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private leaflet: typeof import('leaflet') | null = null;
  private map: LeafletMap | null = null;
  private markers: LayerGroup | null = null;
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const points = this.points();
      if (this.map) this.renderPoints(points);
    });

    afterNextRender(() => {
      void this.initialize();
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.map?.stopLocate();
      this.map?.remove();
      this.map = null;
    });
  }

  private async initialize(): Promise<void> {
    try {
      const leaflet = await import('leaflet');
      if (this.destroyRef.destroyed) return;
      this.leaflet = leaflet;
      this.map = leaflet.map(this.canvas().nativeElement, {
        scrollWheelZoom: false,
        zoomControl: false,
      }).setView([40.4168, -3.7038], 5);
      leaflet.control.zoom({ position: 'bottomright' }).addTo(this.map);
      leaflet.control.scale({ imperial: false, position: 'bottomleft' }).addTo(this.map);
      this.userLocation = leaflet.layerGroup().addTo(this.map);
      this.map.on('locationfound', (event: LocationEvent) => {
        this.locating.set(false);
        this.locationMessage.set('Tu ubicación está marcada en azul.');
        this.userLocation?.clearLayers();
        leaflet.circle(event.latlng, {
          radius: event.accuracy, color: '#3185c5', weight: 1, fillOpacity: 0.08,
        }).addTo(this.userLocation!);
        leaflet.circleMarker(event.latlng, {
          radius: 8, color: '#fff', weight: 3, fillColor: '#3185c5', fillOpacity: 1,
        }).bindTooltip('Tu ubicación').addTo(this.userLocation!);
        this.map?.setView(event.latlng, 13);
      });
      this.map.on('locationerror', (event: ErrorEvent) => {
        this.locating.set(false);
        this.locationMessage.set(event.code === 1
          ? 'Permite el acceso a tu ubicación en el navegador para usar esta opción.'
          : 'No pudimos obtener tu ubicación. Puedes seguir explorando el mapa.');
      });
      const tiles = leaflet.tileLayer(environment.mapTilesUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tiles.on('tileerror', () => this.tileError.set(true));
      tiles.addTo(this.map);
      this.markers = leaflet.layerGroup().addTo(this.map);
      this.renderPoints(this.points());

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
        this.resizeObserver.observe(this.canvas().nativeElement);
      }
      this.ready.set(true);
    } catch {
      this.map?.remove();
      this.map = null;
      this.error.set('No pudimos abrir el mapa. Cierra y vuelve a abrir esta sección.');
    }
  }

  fitAll(): void {
    const groups = groupMapPoints(this.points());
    if (!this.leaflet || !this.map || !groups.length) return;
    const bounds = this.leaflet.latLngBounds(groups.map(group =>
      [group[0].latitude, group[0].longitude] as [number, number]));
    const approximate = groups.some(group => group[0].address?.startsWith('Ubicación aproximada'));
    this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: approximate ? 12 : 15 });
  }

  locate(): void {
    if (!this.map || this.locating()) return;
    this.locationMessage.set(null);
    if (!navigator.geolocation) {
      this.locationMessage.set('Tu navegador no permite obtener la ubicación.');
      return;
    }
    this.locating.set(true);
    this.map.locate({ setView: false, timeout: 10000, maximumAge: 60000 });
  }

  toggleWheel(): void {
    this.wheelZoom.update(value => !value);
    if (this.wheelZoom()) this.map?.scrollWheelZoom.enable();
    else this.map?.scrollWheelZoom.disable();
  }

  toggleExpanded(): void {
    this.expanded.update(value => !value);
  }

  @HostListener('document:keydown.escape')
  collapse(): void {
    this.expanded.set(false);
  }

  private renderPoints(points: readonly EventMapPoint[]): void {
    const leaflet = this.leaflet;
    const map = this.map;
    if (!leaflet || !map || !this.markers) return;
    this.markers.clearLayers();

    const groups = groupMapPoints(points);

    for (const group of groups) {
      const first = group[0];
      const label = document.createElement('span');
      label.className = 'oona-map-pin';
      label.textContent = group.length > 1 ? String(group.length) + ' sesiones' : this.price(first);

      const marker = leaflet.marker([first.latitude, first.longitude], {
        icon: leaflet.divIcon({
          className: 'oona-map-marker',
          html: label.outerHTML,
          iconSize: [112, 34],
          iconAnchor: [56, 34],
          popupAnchor: [0, -34],
        }),
        title: group.length > 1
          ? group.length + ' sesiones en ' + first.locationName
          : first.title,
        alt: 'Abrir eventos en esta ubicación',
      });
      marker.bindPopup(this.popup(group), { maxWidth: 280, maxHeight: 300 });
      marker.addTo(this.markers);

    }
    this.fitAll();
  }

  private popup(points: EventMapPoint[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'oona-map-popup';
    for (const point of points) {
      const article = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = point.title;
      const date = document.createElement('p');
      date.textContent = new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid',
      }).format(new Date(point.startsAt)) + ' · ' + this.price(point);
      const address = document.createElement('p');
      address.textContent = [point.address, point.cityName].filter(Boolean).join(', ');
      const link = document.createElement('a');
      const url = this.router.createUrlTree(['/evento', point.eventId], {
        queryParams: { occurrenceId: point.occurrenceId },
      });
      link.href = this.router.serializeUrl(url);
      link.textContent = 'Ver evento';
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        void this.router.navigateByUrl(url);
      });
      const place = document.createElement('span');
      place.className = 'oona-map-place';
      place.textContent = point.cityName + (point.organizerName ? ' · ' + point.organizerName : '');
      const external = document.createElement('a');
      const approximate = point.address?.startsWith('Ubicación aproximada');
      external.className = 'oona-map-external';
      external.href = approximate
        ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(point.latitude + ',' + point.longitude)
        : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(point.latitude + ',' + point.longitude);
      external.target = '_blank';
      external.rel = 'noopener noreferrer';
      external.textContent = approximate ? 'Ver zona aproximada ↗' : 'Cómo llegar ↗';
      if (approximate) address.className = 'oona-map-approximate';
      const actions = document.createElement('div');
      actions.className = 'oona-map-actions';
      actions.append(link, external);
      article.append(place, title, date, address, actions);
      container.append(article);
    }
    return container;
  }

  private price(point: EventMapPoint): string {
    if (point.priceFrom === null) return 'Ver precio';
    if (point.priceFrom === 0) return 'Gratis';
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: point.currency || 'EUR', maximumFractionDigits: 2,
      }).format(point.priceFrom);
    } catch {
      return String(point.priceFrom);
    }
  }
}
