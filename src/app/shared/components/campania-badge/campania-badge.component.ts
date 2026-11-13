import { Component, computed, input } from '@angular/core';

import { CampaignBadge } from '../../models/campania.model';

/** Distintivo «🎁 Participa en el sorteo» (o «en N sorteos») para experiencias incluidas en campañas abiertas. */
@Component({
  selector: 'app-campania-badge',
  standalone: true,
  template: `
    @if (badge(); as current) {
      <span class="campaign-badge" [class.inline]="inline()">
        <span aria-hidden="true">🎁</span>
        {{ label() }}
      </span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .campaign-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--color-coral, #d4856a);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
      box-shadow: 0 2px 6px rgb(0 0 0 / 18%);
      white-space: nowrap;
    }

    .campaign-badge.inline {
      position: static;
      box-shadow: none;
    }
  `,
})
export class CampaniaBadgeComponent {
  readonly badges = input<CampaignBadge[] | null | undefined>([]);
  /** En línea con el texto en vez de superpuesto sobre la imagen. */
  readonly inline = input(false);

  readonly badge = computed(() => this.badges()?.[0] ?? null);

  /** Sobre la tarjeta solo cabe un distintivo: con varias campañas se resume el número. */
  readonly label = computed(() => {
    const count = this.badges()?.length ?? 0;
    return count > 1 && !this.inline() ? `Participa en ${count} sorteos` : this.badge()?.label ?? '';
  });
}
