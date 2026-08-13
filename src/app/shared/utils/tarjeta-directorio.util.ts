import { SpecialistProfileResponse } from '../../services/profesionales.service';
import { TarjetaDirectorio } from '../models/tarjeta-directorio.model';

export function convertirTipo(
  categoria: string
): 'Profesional' | 'Centro' | 'Organizador de eventos' {

  switch (categoria?.toUpperCase()) {

    case 'CENTRO':
    case 'CENTROS':
      return 'Centro';

    case 'ORGANIZADOR':
    case 'ORGANIZADORES':
    case 'ORGANIZADOR_DE_EVENTOS':
    case 'ORGANIZADORES_DE_EVENTOS':
      return 'Organizador de eventos';

    default:
      return 'Profesional';
  }
}

export function toTarjetaDirectorio(
  perfil: SpecialistProfileResponse,
  resolveAssetUrl: (url?: string) => string | undefined
): TarjetaDirectorio {

  const temas = perfil.workTopics ?? [];
  const tecnicas = perfil.techniques ?? [];

  return {
    id: perfil.id,
    userId: perfil.userId,

    tipo: convertirTipo(perfil.profileCategory),

    nombre: perfil.publicName,

    ubicacion: 'Valencia',
    ubicacionCompleta: 'Valencia, España',

    cita: perfil.biography,
    bio: perfil.description || perfil.biography,

    tags: [...temas, ...tecnicas],

    imagenUrl: resolveAssetUrl(perfil.photoUrl),
    bannerUrl: resolveAssetUrl(perfil.bannerUrl),

    temas,
    tecnicas,

    slug: perfil.slug,

    whatsappPhone: perfil.whatsappPhone,
    phoneNumber: perfil.phoneNumber,
    publicEmail: perfil.publicEmail,
    website: perfil.website,

    socialLinks: perfil.socialLinks,
    languages: (perfil.languages ?? []).map(idioma => idioma.languageName),

    galleryImages: (perfil.galleryImages ?? []).map(imagen => ({
      ...imagen,
      imageUrl: resolveAssetUrl(imagen.imageUrl) ?? imagen.imageUrl,
    })),
    showUpcomingEvents: perfil.showUpcomingEvents,
    showOneToOneSessions: perfil.showOneToOneSessions,
    showGallery: perfil.showGallery,

    isLogoStyle: false,
  };
}
