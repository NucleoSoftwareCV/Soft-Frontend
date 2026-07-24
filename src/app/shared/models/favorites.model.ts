export type FavoriteEntityType = 'EVENTO' | 'SERVICIO' | 'PROFESIONAL';

export interface FavoriteResponse {
  entityType: FavoriteEntityType;
  entityId: number;
  title: string;
  imageUrl?: string;
  categoryName: string;
  locationName?: string;
  price?: number;
  currency?: string;
  slug?: string;
  organizerName?: string;
  startsAt?: string;
  recurrenceLabel?: string;
}

export interface FavoriteIdsResponse {
  eventIds: number[];
  serviceIds: number[];
  professionalIds: number[];
}
