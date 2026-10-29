export interface ReferenceLocation {
  label: string;
  latitude: number;
  longitude: number;
  approximate: boolean;
}
export interface EventTravel {
  occurrenceId: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_REFERENCE';
  distanceKm: number | null;
  durationMinutes: number | null;
  method: 'ROUTE' | 'STRAIGHT_LINE' | null;
  approximate: boolean;
  address: string | null;
  cityName: string | null;
  directionsUrl: string | null;
}
