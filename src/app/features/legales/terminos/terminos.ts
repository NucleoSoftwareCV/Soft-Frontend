import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './terminos.html',
  styleUrl: './terminos.css',
})
export class TerminosComponent {

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