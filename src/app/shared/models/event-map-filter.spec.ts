import { EventModality } from './evento.model';
import { EventMapPoint } from './event-map.model';
import { filterMapPoints } from './event-map-filter';

const point: EventMapPoint = {
  occurrenceId: 1, eventId: 7, title: 'Yoga suave', summary: 'Una práctica de calma',
  priceFrom: 20, currency: 'EUR', startsAt: '2026-10-22T22:30:00Z', endsAt: '2026-10-22T23:30:00Z',
  locationName: 'Centro', address: 'Calle 12', cityName: 'Valencia', latitude: 39, longitude: -0.3,
  categoryId: 1, experienceTypeId: 3, specialistId: 8, modality: 'PRESENCIAL', isRecurring: false,
};

describe('Filtros avanzados del mapa', () => {
  it('combina categoría, tipo, ciudad, profesional y precio con AND', () => {
    const result = filterMapPoints([point, { ...point, occurrenceId: 2, specialistId: 9 }], {
      categoryIds: [1, 2], experienceTypeId: 3, cityName: ' valencia ',
      specialistId: 8, maxPrice: 20, modality: EventModality.PRESENCIAL, isRecurring: false,
    });
    expect(result.map(item => item.occurrenceId)).toEqual([1]);
  });

  it('conserva precio cero y no considera gratuito un precio desconocido', () => {
    const free = { ...point, occurrenceId: 2, priceFrom: 0 };
    expect(filterMapPoints([point, free, { ...point, priceFrom: null }], { maxPrice: 0 })).toEqual([free]);
  });

  it('evalúa fechas y horas en Madrid, incluso cuando cambia el día respecto de UTC', () => {
    expect(filterMapPoints([point], { dateFrom: '2026-10-23', dateTo: '2026-10-23', hourFrom: 0, hourTo: 0 })).toEqual([point]);
    expect(filterMapPoints([point], { dateTo: '2026-10-22' })).toEqual([]);
  });

  it('busca tanto en el título como en el resumen', () => {
    expect(filterMapPoints([point], { search: ' CALMA ' })).toEqual([point]);
    expect(filterMapPoints([point], { search: 'nutrición' })).toEqual([]);
  });

  it('filtra sesiones antes de agrupar la ubicación', () => {
    const second = { ...point, occurrenceId: 2, startsAt: '2026-10-24T12:00:00Z' };
    expect(filterMapPoints([point, second], { dateFrom: '2026-10-24' })).toEqual([second]);
  });

  it('devuelve vacío cuando las condiciones no coinciden y no cambia la lista original', () => {
    const points = [point];
    expect(filterMapPoints(points, { categoryIds: [2] })).toEqual([]);
    expect(filterMapPoints(points, { isRecurring: true })).toEqual([]);
    expect(filterMapPoints(points, { modality: EventModality.ONLINE })).toEqual([]);
    expect(points).toEqual([point]);
  });
});
