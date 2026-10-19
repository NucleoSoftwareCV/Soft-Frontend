import { EventCardResponse } from './evento.model';

export interface RecommendedEventResponse {
  event: EventCardResponse;
  occurrenceId: number;
  score: number;
  reason: string;
}
