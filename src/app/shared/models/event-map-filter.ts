import { EventFilterParams } from './evento.model';
import { EventMapPoint } from './event-map.model';

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

/** Evalúa cada sesión antes de agrupar los marcadores por ubicación. */
export function filterMapPoints(
  points: readonly EventMapPoint[],
  filters: EventFilterParams,
): EventMapPoint[] {
  return points.filter(point => {
    if (filters.categoryId != null && point.categoryId !== filters.categoryId) return false;
    if (filters.categoryIds?.length && !filters.categoryIds.includes(point.categoryId ?? -1)) return false;
    if (filters.experienceTypeId != null && point.experienceTypeId !== filters.experienceTypeId) return false;
    if (filters.specialistId != null && point.specialistId !== filters.specialistId) return false;
    if (filters.modality && point.modality !== filters.modality) return false;
    if (filters.mood && normalize(point.mood) !== normalize(filters.mood)) return false;
    if (filters.isRecurring != null && point.isRecurring !== filters.isRecurring) return false;
    if (filters.cityName && normalize(point.cityName) !== normalize(filters.cityName)) return false;

    const search = normalize(filters.search);
    if (search && !normalize(point.title).includes(search) && !normalize(point.summary).includes(search)) return false;
    if (filters.minPrice != null &&
        (point.priceFrom == null || point.priceFrom < filters.minPrice)) return false;
    if (filters.maxPrice != null &&
        (point.priceFrom == null || point.priceFrom > filters.maxPrice)) return false;

    if (filters.dateFrom || filters.dateTo || filters.hourFrom != null || filters.hourTo != null) {
      const startsAt = new Date(point.startsAt);
      if (!Number.isFinite(startsAt.getTime())) return false;
      const parts = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', hourCycle: 'h23',
      }).formatToParts(startsAt);
      const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
      const date = part('year') + '-' + part('month') + '-' + part('day');
      const hour = Number(part('hour'));
      if (filters.dateFrom && date < filters.dateFrom) return false;
      if (filters.dateTo && date > filters.dateTo) return false;
      if (filters.hourFrom != null && hour < filters.hourFrom) return false;
      if (filters.hourTo != null && hour > filters.hourTo) return false;
    }
    return true;
  });
}
