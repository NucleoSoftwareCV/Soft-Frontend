
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './cookies.html',
  styleUrl: './cookies.css',
})
export class CookiesComponent {

  irASeccion(id: string): void {
    const elemento = document.getElementById(id);

    if (!elemento) {
      return;
    }

    const offset = 90;
    const posicion = elemento.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: posicion,
      behavior: 'smooth'
    });
  }

}
