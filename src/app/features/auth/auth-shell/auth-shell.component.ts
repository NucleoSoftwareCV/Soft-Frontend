import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Shell para las páginas de autenticación.
 * No incluye header ni footer — cada página de auth
 * gestiona su propio layout completo.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AuthShellComponent {}
