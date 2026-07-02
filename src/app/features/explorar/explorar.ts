import { Component, OnInit } from '@angular/core';
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
export class Explorar implements OnInit {
  experiencias: any[] = [];

  paginaActual = 0;
  tamanioPagina = 12;
  totalExperiencias = 0;
  hayMas = true;
  cargando = false;

  imagenPlaceholder = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800';

  mostrarFiltros = false;

  constructor(private experienciasService: ExperienciasService) {}

  ngOnInit() {
    this.cargarMas();
  }

  cargarMas() {
    if (this.cargando || !this.hayMas) return;

    this.cargando = true;

    this.experienciasService.getExperiencias(this.paginaActual, this.tamanioPagina).subscribe({
      next: (resp) => {
        const nuevosEventos = resp.content.map((item: any) => ({
          ...item,
          favorito: false,
          imagen: this.imagenPlaceholder
        }));

        this.experiencias = [...this.experiencias, ...nuevosEventos];
        this.totalExperiencias = resp.totalElements;
        this.hayMas = !resp.last;
        this.paginaActual++;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar eventos:', err);
        this.cargando = false;
      }
    });
  }

  toggleFavorito(item: any) {
    item.favorito = !item.favorito;
  }

  
}