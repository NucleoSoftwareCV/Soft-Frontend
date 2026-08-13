import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly initialUrl = this.document.location?.pathname || this.router.url;

  /** Rutas operativas que no deben mostrar el header/footer global. */
  private readonly SHELLLESS_ROUTES = ['/admin', '/profesional', '/onboarding'];

  /** URL actual como señal reactiva */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.initialUrl),
    ),
    { initialValue: this.initialUrl }
  );

  /** true cuando estamos en una página de autenticación */
  readonly isAuthRoute = computed(() =>
    this.currentUrl().startsWith('/auth')
      || this.currentUrl().startsWith('/login')
      || this.SHELLLESS_ROUTES.some(route =>
        this.currentUrl() === route || this.currentUrl().startsWith(`${route}/`)
      )
  );
}
