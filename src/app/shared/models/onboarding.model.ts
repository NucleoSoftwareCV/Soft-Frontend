import { EventModality } from './evento.model';

export type OnboardingStatus = 'NOT_STARTED' | 'INTERESTS_SAVED' | 'COMPLETED' | 'SKIPPED';

export interface ClientOnboardingResponse {
  status: OnboardingStatus;
  categoryIds: number[];
  cityId: number | null;
  experienceTypeIds: number[];
  modality: EventModality | null;
}

export interface OnboardingPreferencesRequest {
  cityId: number | null;
  experienceTypeIds: number[];
  modality: EventModality | null;
}
