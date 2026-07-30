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
      title: 'Explorar',
      links: [
        { label: 'Todos los eventos', path: '/eventos' },
        { label: 'Sesiones individuales', path: '/sesiones' },
        { label: 'Profesionales', path: '/profesionales' },
        { label: 'Talleres',  path: '/eventos/talleres' },
        { label: 'Retiros',   path: '/eventos/retiros' },
      ],
    },
    {
      title: 'Para profesionales',
      links: [
        { label: 'Publicar evento', path: '/publicar' },
        { label: 'Circulo Oona',    path: '/circulo-oona' },
        { label: 'Cómo funciona',   path: '/como-funciona' },
        { label: 'Tarifas',         path: '/tarifas' },
      ],
    },
    {
      title: 'Oona',
      links: [
        { label: 'Quiénes somos', path: '/nosotros' },
        { label: 'Blog',          path: '/blog' },
        { label: 'Contacto',      path: '/contacto' },
        { label: 'Prensa',        path: '/prensa' },
      ],
    },
  ];

  socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com/oona_es', icon: 'instagram' },
    { label: 'Twitter',   href: 'https://twitter.com/oona_es',   icon: 'twitter'   },
    { label: 'LinkedIn',  href: 'https://linkedin.com',           icon: 'linkedin'  },
  ];
}
