import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExperienciasService } from '../../services/experiencias';
import { map, switchMap, Observable } from 'rxjs';

@Component({
  selector: 'app-detalle-evento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-evento.html',
  styleUrl: './detalle-evento.css'
})
export class DetalleEvento {
  evento$!: Observable<any>;
  similares$!: Observable<any[]>;

  imagenesPlaceholder = [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
  ];

  constructor(
    private route: ActivatedRoute,
    private experienciasService: ExperienciasService
  ) {
    this.evento$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));

        return this.experienciasService.getExperienciaById(id).pipe(
          map(evento => ({
            ...evento,
            imagenes: this.imagenesPlaceholder,
            favorito: false
          }))
        );
      })
    );

    this.similares$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));

        return this.experienciasService.getExperiencias().pipe(
          map(resp =>
            resp.content
              .filter((item: any) => item.id !== id)
              .slice(0, 4)
          )
        );
      })
    );
  }

  getGalleryCount(evento: any) {
    return Math.min(evento?.imagenes?.length || 0, 5);
  }

  getImagenesGaleria(evento: any) {
    return evento?.imagenes?.slice(0, 5) || [];
  }

  getImagenesExtra(evento: any) {
    return (evento?.imagenes?.length || 0) - 5;
  }

  hayImagenesExtra(evento: any) {
    return (evento?.imagenes?.length || 0) > 5;
  }

  toggleFavorito(evento: any) {
    evento.favorito = !evento.favorito;
  }
}