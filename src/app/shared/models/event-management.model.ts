import { SpringPage } from './evento.model';

export type EventStatus = 'BORRADOR' | 'REVISION' | 'PUBLICADO' | 'CANCELADO' | 'ARCHIVADO';
export type EventOccurrenceStatus = 'PROGRAMADA' | 'AGOTADA' | 'CANCELADA' | 'FINALIZADA';

export interface EventManagementEvent {
  id: number;
  title: string;
  summary: string | null;
  description: string;
  includes: string[];
  highlights: string[];
  whatToBring: string[];
  modality: 'ONLINE' | 'PRESENCIAL';
  priceFrom: number;
  currency: string;
  minimumAge: number | null;
  featured: boolean;
  categoryId: number;
  categoryName: string;
  paymentMethod: 'WHATSAPP' | 'ONLINE';
  experienceTypeId: number;
  eventType: string;
  experienceTypeSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventOccurrenceManagement {
  id: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedSpots: number;
  availableSpots: number;
  soldOut: boolean;
  status: EventOccurrenceStatus;
  location: {
    id: number;
    name: string;
    address: string;
    cityName: string;
    latitude: number | null;
    longitude: number | null;
    reference: string | null;
  } | null;
  meetingLink: { platform: string; meetingUrl: string } | null;
}

export interface EventManagementResponse {
  event: EventManagementEvent;
  status: EventStatus;
  specialistId: number;
  occurrences: EventOccurrenceManagement[];
}

export interface EventUpsertRequest {
  title: string;
  summary?: string | null;
  description: string;
  includes: string[];
  highlights: string[];
  whatToBring: string[];
  modality: 'ONLINE' | 'PRESENCIAL';
  priceFrom: number;
  currency: string;
  minimumAge?: number | null;
  featured: boolean;
  categoryId: number;
  paymentMethod: 'WHATSAPP' | 'ONLINE';
  experienceTypeId: number;
  specialistId: number;
}

export interface EventOccurrenceRequest {
  startsAt: string;
  endsAt: string;
  capacity: number;
  location?: {
    name: string;
    address: string;
    cityId: number;
    latitude?: number | null;
    longitude?: number | null;
    reference?: string | null;
  } | null;
  meetingLink?: {
    platform: string;
    meetingUrl: string;
    meetingId?: string;
    password?: string;
  } | null;
}

export interface CreateEventRequest {
  event: EventUpsertRequest;
  occurrence: EventOccurrenceRequest;
}

export interface CreateEventResponse {
  event: EventManagementEvent;
  occurrence: EventOccurrenceManagement;
  message: string;
}

export type EventManagementPage = SpringPage<EventManagementResponse>;
