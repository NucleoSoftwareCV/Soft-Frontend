import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class FavoritosComponent implements OnInit {

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {

    // Si ya inició sesión, Guardados vive dentro de Perfil
    if (this.authService.isLoggedIn) {
      this.router.navigate(
        ['/perfil'],
        {
          queryParams: {
            tab: 'guardados'
          }
        }
      );
    }
  }
}