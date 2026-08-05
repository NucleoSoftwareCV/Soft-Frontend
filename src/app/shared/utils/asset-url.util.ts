import { environment } from '../../../environments/environment';

/**
 * El backend guarda las imágenes subidas por profesionales (foto de perfil, banner)
 * como rutas relativas (ej. "/images/profile-images/33/photo/x.jpg"). Sin este prefijo
 * se resuelven contra el origen del frontend en vez del backend y rompen la imagen.
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url ?? '';
  if (!environment.apiUrl.startsWith('http')) return url;
  return `${new URL(environment.apiUrl).origin}${url.startsWith('/') ? url : `/${url}`}`;
}
