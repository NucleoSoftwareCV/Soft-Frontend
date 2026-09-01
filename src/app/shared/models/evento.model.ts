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

export interface EventOccurrenceCalendarResponse {
  occurrenceId: number;
  eventId: number;
  eventTitle: string;
  coverImageUrl: string | null;
  startsAt: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  slug?: string;
  emoji?: string | null;
  active: boolean;
  deletable?: boolean;
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
  coverImageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  cityName: string | null;
  experienceTypeId: number | null;
  eventType: string | null;
  experienceTypeSlug: string | null;
  isRecurring: boolean;
}

export interface EventOrganizerResponse {
  id: number;
  slug: string | null;
  publicName: string;
  biography: string | null;
  photoUrl: string | null;
  whatsappPhone: string | null;
}

export interface MeetingLinkResponse {
  provider: string | null;
  url: string | null;
}

export type EventPaymentMethod = 'WHATSAPP' | 'ONLINE';

export interface EventDetailResponse {
  id: number;
  title: string;
  summary: string | null;
  description: string | null;
  includes: string[];
  highlights: string[];
  whatToBring: string[];
  modality: EventModality;
  priceFrom: number | null;
  currency: string;
  minimumAge: number | null;
  featured: boolean;
  categoryId: number | null;
  categoryName: string | null;
  paymentMethod?: EventPaymentMethod;
  organizer: EventOrganizerResponse | null;
  occurrences: EventOccurrenceResponse[];
  experienceTypeId: number | null;
  eventType: string | null;
  experienceTypeSlug: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string | null;
  images: { id: number; url: string }[];
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
  categoryIds?: number[];
  experienceTypeId?: number;
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

export interface HomeEventSectionsResponse {
  cityName: string;
  sections: HomeSectionResponse[];
}

export interface HomeSectionResponse {
  key: HomeSectionKey;
  title: string;
  viewAllFilters: HomeViewAllFilters;
  events: HomeEventCardResponse[];
}

export type HomeSectionKey =
  | 'THIS_WEEK'
  | 'WEEKEND'
  | 'YOGA'
  | 'BREATHWORK_ICE'
  | 'SLOW_DOWN'
  | 'WORKSHOPS'
  | 'RETREATS';

export type EventType = 'TALLER' | 'RETIRO' | 'CLASE' | 'CEREMONIA' | 'ENCUENTRO_GRUPAL' | 'FORMACION';

export interface HomeViewAllFilters {
  categoryIds: number[];
  eventType: EventType | null;
  dateFrom: string | null;
  dateTo: string | null;
  cityName: string;
  includeOnline: boolean;
}

export interface HomeEventCardResponse {
  id: number;
  title: string;
  coverImageUrl: string;
  startsAt: string;
  modality: EventModality;
  cityName: string | null;
  organizerName: string;
  organizerPhotoUrl: string;
  priceFrom: number | null;
  currency: string;
  recurrenceLabel: string | null;
}
