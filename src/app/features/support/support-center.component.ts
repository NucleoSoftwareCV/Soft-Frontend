import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from './models/support.model';
import {
  LucideArrowRight,
  LucideBriefcase,
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideCreditCard,
  LucideGift,
  LucideHeadset,
  LucideRotateCcw,
  LucideSearch,
  LucideSettings,
  LucideTicket,
  LucideUserRound,
} from '@lucide/angular';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideArrowRight,
    LucideBriefcase,
    LucideCalendarCheck,
    LucideCalendarDays,
    LucideCreditCard,
    LucideGift,
    LucideHeadset,
    LucideRotateCcw,
    LucideSearch,
    LucideSettings,
    LucideTicket,
    LucideUserRound,
  ],
  template: `<section class="hero">
      <h1>¿En qué podemos ayudarte?</h1>
      <p>Reporta una incidencia, consulta tus solicitudes o sigue tu reembolso.</p>
      <label class="search">
        <svg lucideSearch aria-hidden="true"></svg>
        <input
          [(ngModel)]="query"
          placeholder="Buscar una categoría de ayuda"
          aria-label="Buscar categoría"
          type="search"
        />
      </label>
      <div class="hero-actions">
        <a class="button" routerLink="/soporte/nuevo">Crear una solicitud</a
        ><a class="button secondary" routerLink="/soporte/tickets">Mis solicitudes</a>
      </div>
    </section>
    <div class="category-grid">
      @for (c of filtered(); track c) {
        <a
          class="category-card"
          [routerLink]="c === 'REEMBOLSOS' ? '/soporte/reembolsos/nuevo' : '/soporte/nuevo'"
          [queryParams]="{ category: c }"
          ><span class="category-icon">
            @switch (c) {
              @case ('PAGOS') {
                <svg lucideCreditCard aria-hidden="true"></svg>
              }
              @case ('REEMBOLSOS') {
                <svg lucideRotateCcw aria-hidden="true"></svg>
              }
              @case ('RESERVAS') {
                <svg lucideCalendarCheck aria-hidden="true"></svg>
              }
              @case ('EVENTOS') {
                <svg lucideCalendarDays aria-hidden="true"></svg>
              }
              @case ('REWARDS') {
                <svg lucideGift aria-hidden="true"></svg>
              }
              @case ('CANJES') {
                <svg lucideTicket aria-hidden="true"></svg>
              }
              @case ('CUENTA') {
                <svg lucideUserRound aria-hidden="true"></svg>
              }
              @case ('PROFESIONALES') {
                <svg lucideBriefcase aria-hidden="true"></svg>
              }
              @case ('TECNICO') {
                <svg lucideSettings aria-hidden="true"></svg>
              }
              @default {
                <svg lucideHeadset aria-hidden="true"></svg>
              }
            }
          </span>
          <h2>{{ label(c) }}</h2>
          <p>
            {{ descriptions[c] || 'Cuéntanos lo ocurrido y recibe atención de nuestro equipo.' }}
          </p>
          <svg class="category-arrow" lucideArrowRight aria-hidden="true"></svg
        ></a>
      } @empty {
        <p role="status">No encontramos categorías que coincidan con tu búsqueda.</p>
      }
    </div>`,
  styleUrl: './support.css',
})
export class SupportCenterComponent {
  query = '';
  categories = CATEGORIES;
  descriptions: Record<string, string> = {
    PAGOS: 'Ayuda con tus operaciones y confirmaciones de pago.',
    REEMBOLSOS: 'Solicita una devolución y consulta su estado.',
    RESERVAS: 'Revisa incidencias relacionadas con tus reservas.',
    REWARDS: 'Consulta sobre la acumulación de tus puntos.',
    CANJES: 'Ayuda con el canje de tus puntos.',
  };
  filtered() {
    return this.categories.filter((c) => c.toLowerCase().includes(this.query.toLowerCase()));
  }
  label(c: string) {
    return c.charAt(0) + c.slice(1).toLowerCase();
  }
}
