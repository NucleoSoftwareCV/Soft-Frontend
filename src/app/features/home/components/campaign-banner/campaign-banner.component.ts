import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CampaniasService } from '../../../../services/campanias.service';
import { CampaignSummary } from '../../../../shared/models/campania.model';

/** Banner de la home que da acceso a la campaña promocional vigente. */
@Component({
  selector: 'app-campaign-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './campaign-banner.component.html',
  styleUrl: './campaign-banner.component.css',
})
export class CampaignBannerComponent implements OnInit {
  private readonly campaniasService = inject(CampaniasService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly campaigns = signal<CampaignSummary[]>([]);

  /** Prioriza la campaña abierta; si no hay, anuncia la próxima. */
  readonly campaign = computed<CampaignSummary | null>(() => {
    const list = this.campaigns();
    return list.find((c) => c.phase === 'ABIERTA') ?? list.find((c) => c.phase === 'PROXIMA') ?? null;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.campaniasService.getActive().subscribe({
      next: (campaigns) => this.campaigns.set(campaigns),
      error: () => this.campaigns.set([]),
    });
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
