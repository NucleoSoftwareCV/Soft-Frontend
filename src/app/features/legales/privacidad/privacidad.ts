import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.css',
})
export class PrivacidadComponent {

  irASeccion(id: string): void {
    const elemento = document.getElementById(id);

    if (!elemento) {
      return;
    }

    elemento.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

}