import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExperienciasService {

  private experiencias = [
    {
      id: 1,
      titulo: 'Yoga al aire libre en el parque',
      categoria: 'Yoga',
      fecha: 'HOY • 11:30',
      fechaDetalle: 'Sábado, 13 de junio',
      horaDetalle: '01:00–02:30 · 1 hora 30 min',
      lugar: 'Lima',
      ciudad: 'Lima',
      ubicacion: 'Parque Central',
      precio: '20.00 €',
      modalidad: 'En persona',
      plazas: 10,
      autor: 'María López',
      avatar: 'https://i.pravatar.cc/100?img=1',
      imagen: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      imagenes: [
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
        'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'
      ],
      descripcion: [
        'Clase de yoga para todos los niveles en un ambiente natural y relajado.',
        'Una experiencia pensada para desconectar, respirar y conectar con tu cuerpo.'
      ],
      incluye: ['Esterilla de Yoga', 'Sesión de Yoga', 'Desayuno saludable'],
      traer: ['Ropa cómoda', 'Botella de agua'],
      favorito: false
    },
    {
      id: 2,
      titulo: 'Meditación guiada para principiantes',
      categoria: 'Meditación',  
      fecha: 'MAÑANA • 09:00',
      lugar: 'Miraflores',
      autor: 'Carlos Ruiz',
      precio: '22',
      imagen: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
      avatar: 'https://i.pravatar.cc/100?img=2',
      favorito: false
    },
    {
      id: 3,
      titulo: 'Pilates para mejorar la postura',
      categoria: 'Movimiento',
      fecha: 'SÁBADO • 10:00',
      lugar: 'San Isidro',
      autor: 'Ana Torres',
      precio: '22',
      imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      avatar: 'https://i.pravatar.cc/100?img=3',
      favorito: false
    },
    {
      id: 4,
      titulo: 'Meditación guiada para principiantes',
      categoria: 'Meditación',
      fecha: 'MAÑANA • 09:00',
      lugar: 'Miraflores',
      autor: 'Carlos Ruiz',
      precio: '22',
      imagen: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
      avatar: 'https://i.pravatar.cc/100?img=2',
      favorito: false
    },
    {
      id: 5,
      titulo: 'Meditación guiada para principiantes',
      categoria: 'Meditación',
      fecha: 'MAÑANA • 09:00',
      lugar: 'Miraflores',
      autor: 'Carlos Ruiz',
      precio: '22',
      imagen: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
      avatar: 'https://i.pravatar.cc/100?img=2',
      favorito: false
    },
  ];

  getExperiencias() {
    return this.experiencias;
  }

  getExperienciaById(id: number) {
    return this.experiencias.find(item => item.id === id);
  }
}