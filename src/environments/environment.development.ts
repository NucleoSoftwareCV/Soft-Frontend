// ============================================================
// ENTORNO DE DESARROLLO
// Usado con: ng serve / ng build --configuration development
// ============================================================
export const environment = {
  production: false,

  // URL base del backend local
  apiUrl: 'http://localhost:3000/api',

  // Nombre de la app (útil para logs, títulos, etc.)
  appName: 'Oona (Dev)',

  // Activar logs de debug en consola
  enableDebugLogs: true,

  // Futura integración OAuth Google (dev)
  googleClientId: '',

  // Futura clave pública de pasarela de pago (dev/sandbox)
  stripePublicKey: '',
};
