import { EventCardResponse, EventFilterParams } from './evento.model';

export interface RecommendedEventResponse {
  event: EventCardResponse;
  occurrenceId: number;
  score: number;
  reason: string;
}

export interface RecommendationFilterParams extends Omit<
  EventFilterParams,
  'page' | 'size' | 'sort'
> {
  includeOnline?: boolean;
  useProfileCity?: boolean;
  specialistId?: number;
}
