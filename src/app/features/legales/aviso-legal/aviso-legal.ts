import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-aviso-legal',
  standalone: true,
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './aviso-legal.html',
  styleUrl: './aviso-legal.css',
})
export class AvisoLegalComponent {

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