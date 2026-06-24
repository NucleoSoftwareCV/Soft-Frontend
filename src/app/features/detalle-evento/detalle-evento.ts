import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExperienciasService } from '../../services/experiencias';

@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-evento.html',
  styleUrl: './detalle-evento.css'
})
export class DetalleEvento {
  evento: any;
  similares: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private experienciasService: ExperienciasService
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.evento = this.experienciasService.getExperienciaById(id);

    this.similares = this.experienciasService
      .getExperiencias()
      .filter(item => item.id !== id)
      .slice(0, 4);
  }

  getGalleryCount() {
    return Math.min(this.evento?.imagenes?.length || 0, 5);
  }

  toggleFavorito() {
    this.evento.favorito = !this.evento.favorito;
  }
}