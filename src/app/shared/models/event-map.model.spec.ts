import { groupMapPoints, hasMapCoordinates } from './event-map.model';
import { EventMapPoint } from './event-map.model';

const point: EventMapPoint = {
  eventId: 1, occurrenceId: 1, title: 'Yoga', priceFrom: null, currency: 'EUR',
  startsAt: '2026-12-22T12:00:00Z', endsAt: '2026-12-22T13:00:00Z',
  locationName: 'Centro', address: 'Calle 12', cityName: 'Valencia',
  latitude: 39.4, longitude: -0.3,
};

describe('Ubicaciones del mapa', () => {
  it('acepta cero como coordenada y rechaza datos ausentes', () => {
    expect(hasMapCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
    expect(hasMapCoordinates({ latitude: null, longitude: 0 })).toBe(false);
    expect(hasMapCoordinates(null)).toBe(false);
  });

  it('rechaza coordenadas fuera de rango y valores no finitos', () => {
    expect(hasMapCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(hasMapCoordinates({ latitude: 0, longitude: -181 })).toBe(false);
    expect(hasMapCoordinates({ latitude: Number.NaN, longitude: 0 })).toBe(false);
    expect(hasMapCoordinates({ latitude: 0, longitude: Number.POSITIVE_INFINITY })).toBe(false);
  });

  it('mantiene todas las sesiones que comparten ubicación en un solo marcador', () => {
    const groups = groupMapPoints([
      point,
      { ...point, eventId: 2, occurrenceId: 2 },
      { ...point, eventId: 3, occurrenceId: 3, latitude: 41.4 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].map(item => item.eventId)).toEqual([1, 2]);
    expect(groups[1][0].eventId).toBe(3);
  });

  it('no crea marcadores con coordenadas inválidas', () => {
    expect(groupMapPoints([{ ...point, latitude: 300 }])).toEqual([]);
  });
});
