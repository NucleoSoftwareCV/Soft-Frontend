import { Component } from '@angular/core';
import { HeroComponent }                 from './components/hero/hero.component';
import { CategoriesComponent }           from './components/categories/categories.component';
import { EventsWeekComponent }           from './components/events-week/events-week.component';
import { ProfessionalsSectionComponent } from './components/professionals-section/professionals-section.component';
import { CtaBannerComponent }            from './components/cta-banner/cta-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    CategoriesComponent,
    EventsWeekComponent,
    ProfessionalsSectionComponent,
    CtaBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  /**
   * El botón de filtro del hero emite este evento.
   * Se despacha como CustomEvent global para que el Header
   * (que vive fuera del árbol de HomeComponent) lo reciba.
   */
  onOpenFilter(): void {
    window.dispatchEvent(new CustomEvent('oona:open-filter'));
  }
}
