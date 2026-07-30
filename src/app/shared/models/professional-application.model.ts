export type ProfessionalApplicationStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type ProfessionalType =
  | 'TERAPEUTA'
  | 'COACH'
  | 'YOGA'
  | 'ACUPUNTURA'
  | 'CONSTELACIONES'
  | 'FISIOTERAPIA'
  | 'ARTETERAPIA'
  | 'BREATHWORK'
  | 'TALLERES_RETIROS'
  | 'MASAJE_TERAPIA_CORPORAL'
  | 'NUTRICION'
  | 'MEDITACION_MINDFULNESS'
  | 'SONIDO'
  | 'PSICOTERAPIA'
  | 'ESPACIO_BIENESTAR'
  | 'OTRO';

export interface ProfessionalApplicationRequest {
  fullName: string;
  cityId: number;
  professionalType: ProfessionalType;
  whatsappPhone: string;
  motivation: string;
  privacyAccepted: boolean;
}

export interface ProfessionalApplicationDecisionRequest {
  status: 'APROBADO' | 'RECHAZADO';
  rejectionReason?: string;
}

export interface ProfessionalApplicationResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  cityId: number;
  cityName: string;
  professionalType: ProfessionalType;
  whatsappPhone: string;
  motivation: string;
  status: ProfessionalApplicationStatus;
  evaluatedById: number | null;
  evaluatedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const PROFESSIONAL_TYPE_OPTIONS: ReadonlyArray<{
  value: ProfessionalType;
  label: string;
}> = [
  { value: 'TERAPEUTA', label: 'Terapeuta' },
  { value: 'COACH', label: 'Coach' },
  { value: 'YOGA', label: 'Profe de yoga' },
  { value: 'ACUPUNTURA', label: 'Acupunturista' },
  { value: 'CONSTELACIONES', label: 'Facilitador/a de constelaciones' },
  { value: 'FISIOTERAPIA', label: 'Fisioterapeuta' },
  { value: 'ARTETERAPIA', label: 'Arteterapeuta' },
  { value: 'BREATHWORK', label: 'Respiracion / Breathwork' },
  { value: 'TALLERES_RETIROS', label: 'Talleres / Retiros' },
  { value: 'MASAJE_TERAPIA_CORPORAL', label: 'Masajista / Terapeuta corporal' },
  { value: 'NUTRICION', label: 'Nutricionista / Dietista' },
  { value: 'MEDITACION_MINDFULNESS', label: 'Meditacion / Mindfulness' },
  { value: 'SONIDO', label: 'Sound Healing / Banos de sonido' },
  { value: 'PSICOTERAPIA', label: 'Psicoterapeuta' },
  { value: 'ESPACIO_BIENESTAR', label: 'Gestiono un espacio de bienestar' },
  { value: 'OTRO', label: 'Otra disciplina de bienestar' },
];
