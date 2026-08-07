import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerLinks = [
    {
      title: 'EXPLORAR',
      links: [
        { label: 'Todos los eventos', path: '/explorar' },
        { label: 'Sesiones 1:1', path: '/sesiones' },
        { label: 'Profesionales y centros', path: '/profesionales' },
        { label: 'Retiros 2026', path: '/explorar' },
      ],
    },
    {
      title: 'COMUNIDAD',
      links: [
        { label: 'Crear cuenta', path: '/auth/login' },
        { label: 'Iniciar sesión', path: '/auth/login' },
        { label: 'Grupo WhatsApp', href: 'https://wa.me/34600000000' },
      ],
    },
    {
      title: 'PROFESIONALES',
      links: [
        { label: 'Circulo Oona', path: '/circulo-oona' },
        { label: 'Acceder a mi panel', path: '/profesional' },
      ],
    },
  ];

  socialLinks = [
    { label: 'Email', href: 'mailto:hola@oona.es', icon: 'email' },
    { label: 'WhatsApp', href: 'https://wa.me/34600000000', icon: 'whatsapp' },
    { label: 'Instagram', href: 'https://instagram.com/oona_es', icon: 'instagram' },
    { label: 'TikTok', href: 'https://tiktok.com/@oona_es', icon: 'tiktok' },
  ];
}
