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

export type DateFilter = 'HOY' | 'MANANA' | 'ESTE_FINDE' | 'ESTA_SEMANA' | 'PROXIMA_SEMANA' | 'PROXIMO_MES' | 'ELEGIR_FECHA';
export type TimeFilter = 'MANANA' | 'MEDIODIA' | 'TARDE' | 'NOCHE';

export interface EventFilterParams {
  dateFilter?: DateFilter;
  timeFilter?: TimeFilter;
  selectedDate?: string;
  categoryId?: number;
  cityId?: number;
  modality?: EventModality;
  priceMin?: number;
  priceMax?: number;
}
