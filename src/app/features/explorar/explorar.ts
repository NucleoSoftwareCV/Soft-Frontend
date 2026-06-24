import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienciasService } from '../../services/experiencias';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar {
  experiencias: any[] = [];

  constructor(private experienciasService: ExperienciasService) {
    this.experiencias = this.experienciasService.getExperiencias();
  }

  toggleFavorito(item: any) {
    item.favorito = !item.favorito;
  }
  
}