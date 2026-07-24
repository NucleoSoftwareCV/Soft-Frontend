export interface EventOccurrenceResponse {
  id: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedSpots: number;
  availableSpots: number;
  soldOut: boolean;
  status: string;
  location: LocationResponse | null;
  meetingLink?: MeetingLinkResponse | null;
}

export interface EventOccurrencePublicResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  availableSpots: number;
  soldOut: boolean;
  status: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface LocationResponse {
  id: number;
  name: string;
  address: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  reference: string;
}

export interface CityResponse {
  id: number;
  name: string;
  province: string;
  countryCode: string;
  active: boolean;
}

export enum EventModality {
  PRESENCIAL = 'PRESENCIAL',
  ONLINE = 'ONLINE',
  HIBRIDA = 'HIBRIDA',
}

export type EventType = 'TALLER' | 'RETIRO' | 'CLASE' | 'CEREMONIA' | 'ENCUENTRO_GRUPAL' | 'FORMACION';

export interface EventCardResponse {
  id: number;
  title: string;
  summary: string | null;
  modality: EventModality;
  priceFrom: number | null;
  currency: string;
  categoryId: number | null;
  categoryName: string | null;
  organizerId: number | null;
  organizerName: string | null;
  organizerPhotoUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  cityName: string | null;
  eventType: EventType | null;
  isRecurring: boolean;
}

export interface EventOrganizerResponse {
  id: number;
  publicName: string;
  biography: string | null;
  photoUrl: string | null;
  whatsappPhone: string | null;
}

export interface MeetingLinkResponse {
  provider: string | null;
  url: string | null;
}

export interface EventDetailResponse {
  id: number;
  title: string;
  summary: string | null;
  description: string | null;
  modality: EventModality;
  priceFrom: number | null;
  currency: string;
  minimumAge: number | null;
  featured: boolean;
  categoryId: number | null;
  categoryName: string | null;
  organizer: EventOrganizerResponse | null;
  occurrences: EventOccurrenceResponse[];
  eventType: EventType | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type DateFilter = 'HOY' | 'MANANA' | 'ESTE_FINDE' | 'ESTA_SEMANA' | 'PROXIMA_SEMANA' | 'PROXIMO_MES' | 'ELEGIR_FECHA';
export type TimeFilter = 'MANANA' | 'MEDIODIA' | 'TARDE' | 'NOCHE';

export interface EventFilterParams {
  search?: string;
  categoryId?: number;
  eventType?: EventType;
  modality?: EventModality;
  cityName?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  hourFrom?: number;
  hourTo?: number;
  isRecurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
