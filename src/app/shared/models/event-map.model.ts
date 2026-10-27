import { LocationResponse } from './evento.model';

export interface EventMapPoint {
  summary?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  experienceTypeId?: number | null;
  experienceTypeName?: string | null;
  specialistId?: number | null;
  organizerName?: string | null;
  modality?: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDA';
  isRecurring?: boolean;
  mood?: string | null;
  occurrenceId: number;
  eventId: number;
  title: string;
  priceFrom: number | null;
  currency: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  address: string;
  cityName: string;
  latitude: number;
  longitude: number;
}

export function hasMapCoordinates(
  location: Pick<LocationResponse, 'latitude' | 'longitude'> | null | undefined,
): location is { latitude: number; longitude: number } {
  return !!location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180;
}

/** Reúne las sesiones que comparten ubicación para no tapar sus marcadores. */
export function groupMapPoints(points: readonly EventMapPoint[]): EventMapPoint[][] {
  const groups = new Map<string, EventMapPoint[]>();
  for (const point of points) {
    if (!hasMapCoordinates(point)) continue;
    const key = point.latitude + ',' + point.longitude;
    const group = groups.get(key) ?? [];
    group.push(point);
    groups.set(key, group);
  }
  return [...groups.values()];
}
