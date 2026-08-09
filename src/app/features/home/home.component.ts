import { Component, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HeroComponent }              from './components/hero/hero.component';
import { CategoriesComponent }        from './components/categories/categories.component';
import { EventRowComponent, EventItem } from './components/event-row/event-row.component';
import { ProfessionalsGridComponent } from './components/professionals-grid/professionals-grid.component';
import { CommunityBannerComponent }   from './components/community-banner/community-banner.component';
import { CtaBannerComponent }         from './components/cta-banner/cta-banner.component';

import { OnInit, inject } from '@angular/core';
import { EventosService } from '../../services/eventos.service';
import { HomeSectionResponse, HomeEventCardResponse} from '../../shared/models/evento.model';

interface HomeSectionViewModel extends HomeSectionResponse {
  mappedEvents: EventItem[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    CategoriesComponent,
    EventRowComponent,
    ProfessionalsGridComponent,
    CommunityBannerComponent,
    CtaBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl:    './home.component.css',
})

export class HomeComponent implements OnInit {



  private readonly eventosService =
    inject(EventosService);
  private readonly platformId = inject(PLATFORM_ID);

  homeSections: HomeSectionViewModel[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.eventosService.getHomeSections().subscribe({

      next: (response) => {
        this.homeSections = response.sections.map(section => ({
          ...section,
          mappedEvents: this.convertirEventos(section.events)
        }));
      },

      error: (error) => {
        console.error(error);
      }

    });
  }

  onOpenFilter(): void {
    window.dispatchEvent(new CustomEvent('oona:open-filter'));
  }


  convertirEventos(events: HomeEventCardResponse[]): EventItem[] {

  return events.map(event => ({

    id: event.id,

    title: event.title,

    dateLabel: this.formatearFecha(event.startsAt),

    recurrent: event.recurrenceLabel === 'RECURRENTE',

    location: event.cityName ?? '',

    host: event.organizerName,

    hostAvatar: event.organizerPhotoUrl ?? '',

    image: this.optimizarImagen(event.coverImageUrl),

    spotsLeft: null

  }));

}

private optimizarImagen(url: string | null): string {

  if (!url) {
    return '';
  }

  if (url.includes('images.unsplash.com')) {

    return `${url}?w=600&h=400&fit=crop&auto=format&q=80`;
  }
  return url;
}

private formatearFecha(fecha: string | null): string {

  if (!fecha) return '';

  return new Date(fecha).toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

}
}
