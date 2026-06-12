// ============================================================
// ENTORNO DE PRODUCCIÓN
// Usado con: ng build / ng build --configuration production
// ============================================================
export const environment = {
  production: true,

  // TODO: reemplazar con la URL real del backend en producción
  apiUrl: '',

  // Nombre de la app
  appName: 'Oona',

  // Desactivar logs de debug en producción
  enableDebugLogs: false,

  // TODO: añadir cuando tengas el Client ID de Google OAuth
  googleClientId: '',

  // TODO: añadir cuando tengas la clave pública de Stripe
  stripePublicKey: '',
};
