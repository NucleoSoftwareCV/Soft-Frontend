export interface MatchRequestUpsertRequest {
  name: string;
  age: number;
  email: string;
  whatsapp: string;
  exactZone: string;
  gender: string; // MUJER, HOMBRE, OTRA_IDENTIDAD
  languages: string[]; // ESPANOL, INGLES
  categoryIds: number[]; // IDs de categorías
  availableDays: string[]; // LUNES, MARTES, etc.
  expectations: string;
  descriptors: string[]; // EMPRENDEDOR, EMBARAZADA, PROFESIONAL_BIENESTAR
}

export interface MatchSubmissionResponse {
  message: string;
}
