import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="panel">
      <h1>Inicia sesión para continuar</h1>
      <p>Usa tu cuenta de Oona para enviar una solicitud y seguir su estado.</p>
      <a class="button" routerLink="/auth/login">Iniciar sesión</a>
      <a class="button secondary" routerLink="/auth/register">Crear cuenta</a>
    </section>
  `,
  styleUrl: './support.css',
})
export class SupportSignInComponent {}
