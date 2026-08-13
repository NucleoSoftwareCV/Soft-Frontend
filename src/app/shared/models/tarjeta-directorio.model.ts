import { GalleryImageResponse, ProfessionalSocialLinkResponse } from '../../services/profesionales.service';

export interface TarjetaDirectorio {

  id: number;
  userId: number;

  tipo:
    | 'Profesional'
    | 'Centro'
    | 'Organizador de eventos';

  nombre: string;

  ubicacion: string;
  ubicacionCompleta?: string;

  cita: string;
  bio?: string;

  tags: string[];

  imagenUrl?: string;
  bannerUrl?: string;

  isLogoStyle?: boolean;
  logoMarca?: string;
  logoSub?: string;

  temas?: string[];
  tecnicas?: string[];

  slug: string;

  whatsappPhone?: string;
  phoneNumber?: string;
  publicEmail?: string;
  website?: string;

  socialLinks?: ProfessionalSocialLinkResponse[];
  languages?: string[];

  galleryImages?: GalleryImageResponse[];
  showUpcomingEvents?: boolean;
  showOneToOneSessions?: boolean;
  showGallery?: boolean;
}
