import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

interface PointMovement {
  id: number;
  type: 'EARN' | 'REDEEM';
  pointsQuantity: number;
  balanceAfter: number;
  createdAt: string;
}

@Component({
  selector: 'app-profile-points',
  imports: [DatePipe],
  template: `
    <section aria-labelledby="profile-points-title">
      <h2 id="profile-points-title">Mis puntos</h2>
      @if (balance.isLoading()) {
        <p role="status">Cargando saldo…</p>
      } @else if (balance.error()) {
        <p role="alert">No se pudo cargar tu saldo.</p>
        <button type="button" (click)="balance.reload()">Reintentar</button>
      } @else {
        <p class="balance"><strong>{{ balance.value() }}</strong> puntos disponibles</p>
      }

      <h3>Últimos 50 movimientos</h3>
      @if (history.isLoading()) {
        <p role="status">Cargando movimientos…</p>
      } @else if (history.error()) {
        <p role="alert">No se pudo cargar tu historial.</p>
        <button type="button" (click)="history.reload()">Reintentar</button>
      } @else {
        <ul>
          @for (movement of history.value(); track movement.id) {
            <li>
              <span>
                <strong>{{ movement.type === 'EARN' ? 'Puntos ganados' : 'Puntos usados' }}</strong>
                <time [attr.datetime]="movement.createdAt">{{ movement.createdAt | date:'dd/MM/yyyy' }}</time>
              </span>
              <span>
                <strong>{{ movement.type === 'EARN' ? '+' : '−' }}{{ movement.pointsQuantity }}</strong>
                <small>Saldo {{ movement.balanceAfter }}</small>
              </span>
            </li>
          } @empty {
            <li>Aún no tienes movimientos de puntos.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    section { display: grid; gap: 1rem; padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); }
    h2, h3, p, ul { margin: 0; }
    .balance strong { color: var(--color-primary); font-size: 2rem; margin-inline-end: .2em; }
    ul { list-style: none; padding: 0; }
    li { display: flex; justify-content: space-between; gap: 1rem; padding: .8rem 0; border-block-start: 1px solid var(--color-border); }
    time, small { display: block; margin-block-start: .2rem; }
    li > span:last-child { text-align: end; }
    button { justify-self: start; padding: .45rem .8rem; border: 1px solid var(--color-primary); border-radius: .5rem; color: var(--color-primary); background: transparent; cursor: pointer; }
  `,
})
export class ProfilePointsComponent {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/rewards`;

  readonly balance = rxResource({ stream: () => this.http.get<number>(`${this.url}/points`) });
  readonly history = rxResource({ stream: () => this.http.get<PointMovement[]>(`${this.url}/transactions`) });
}
