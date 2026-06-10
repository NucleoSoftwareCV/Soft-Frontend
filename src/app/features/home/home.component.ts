import { Component } from '@angular/core';
import { HeroComponent }                 from './components/hero/hero.component';
import { CategoriesComponent }           from './components/categories/categories.component';
import { EventsSectionComponent }        from './components/events-section/events-section.component';
import { ProfessionalsSectionComponent } from './components/professionals-section/professionals-section.component';
import { CtaBannerComponent }            from './components/cta-banner/cta-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    CategoriesComponent,
    EventsSectionComponent,
    ProfessionalsSectionComponent,
    CtaBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
