import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CampaniasService } from '../../../../services/campanias.service';
import { CampaignSummary } from '../../../../shared/models/campania.model';
import { resolveAssetUrl } from '../../../../shared/utils/asset-url.util';

export const CAMPAIGN_ROTATION_MS = 8000;

/**
 * Banner de la home con las campañas promocionales vigentes. Con varias, rota entre ellas
 * (abiertas primero, por cierre más cercano, como las ordena el backend) y se pausa al interactuar.
 */
@Component({
  selector: 'app-campaign-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './campaign-banner.component.html',
  styleUrl: './campaign-banner.component.css',
})
export class CampaignBannerComponent implements OnInit, OnDestroy {
  private readonly campaniasService = inject(CampaniasService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly campaigns = signal<CampaignSummary[]>([]);
  private readonly paused = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  /** Abiertas y próximas; las cerradas no se anuncian. */
  readonly slides = computed(() => this.campaigns().filter((c) => c.phase !== 'CERRADA'));
  readonly index = signal(0);
  readonly campaign = computed<CampaignSummary | null>(() => this.slides()[this.index()] ?? null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.campaniasService.getActive().subscribe({
      next: (campaigns) => {
        this.campaigns.set(campaigns);
        this.index.set(0);
      },
      error: () => this.campaigns.set([]),
    });
    this.timer = setInterval(() => {
      if (!this.paused() && this.slides().length > 1) {
        this.next();
      }
    }, CAMPAIGN_ROTATION_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  imageUrl(campaign: CampaignSummary): string {
    return resolveAssetUrl(campaign.heroImageUrl);
  }

  next(): void {
    const total = this.slides().length;
    this.index.update((i) => (total ? (i + 1) % total : 0));
  }

  previous(): void {
    const total = this.slides().length;
    this.index.update((i) => (total ? (i - 1 + total) % total : 0));
  }

  goTo(i: number): void {
    this.index.set(i);
  }

  pause(paused: boolean): void {
    this.paused.set(paused);
  }

  prizeLabel(campaign: CampaignSummary): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: campaign.prizeCurrency || 'EUR',
      maximumFractionDigits: 0,
    }).format(campaign.prizeAmount);
  }

  dateLabel(iso: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Madrid',
    }).format(new Date(iso));
  }
}
