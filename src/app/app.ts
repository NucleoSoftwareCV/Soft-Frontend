import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  /** Prefijos de ruta que no deben mostrar el header/footer global */
  private readonly AUTH_PREFIXES = ['/auth', '/login'];

  /** URL actual como señal reactiva */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url }
  );

  /** true cuando estamos en una página de autenticación */
  readonly isAuthRoute = computed(() =>
    this.AUTH_PREFIXES.some(prefix => this.currentUrl().startsWith(prefix))
  );
}
