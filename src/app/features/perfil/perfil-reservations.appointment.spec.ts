import { describe, expect, it } from 'vitest';

import { AppointmentReceipt } from '../../services/appointment.service';
import { MyBooking } from '../../services/checkout.service';
import {
  isActiveAppointmentReservation,
  isActiveEventReservation,
} from './perfil.component';

const now = Date.parse('2026-11-13T15:00:00Z');

function appointment(status: string, startsAt: string, expiresAt: string | null = null): AppointmentReceipt {
  return {
    id: 1,
    code: 'CITA-1',
    serviceId: 1,
    title: 'Sesión de prueba',
    professionalName: 'Profesional',
    customerName: 'Cliente',
    modality: 'ONLINE',
    venue: null,
    price: 30,
    currency: 'PEN',
    status,
    expiresAt,
    reason: '',
    startsAt,
    endsAt: startsAt,
  };
}

function eventBooking(status: string, occurrenceStartsAt: string): MyBooking {
  return {
    code: 'ORDER-1',
    status,
    quantity: 1,
    totalAmount: 20,
    currency: 'PEN',
    createdAt: '2026-11-10T10:00:00Z',
    eventId: 1,
    eventTitle: 'Evento',
    occurrenceStartsAt,
    modality: 'PRESENCIAL',
    locationName: 'Sede',
    cityName: 'Lima',
  };
}

describe('contadores de reservas del perfil', () => {
  it('cuenta citas futuras confirmadas, pendientes y con propuesta vigente', () => {
    expect(isActiveAppointmentReservation(appointment('CONFIRMADA', '2026-11-14T15:00:00Z'), now)).toBe(true);
    expect(isActiveAppointmentReservation(appointment('REPROGRAMACION_PROPUESTA', '2026-11-16T15:00:00Z'), now)).toBe(true);
    expect(isActiveAppointmentReservation(appointment('PENDIENTE', '2026-11-15T15:00:00Z', '2026-11-13T16:00:00Z'), now)).toBe(true);
  });

  it('excluye citas vencidas, canceladas, completadas o con solicitud expirada', () => {
    expect(isActiveAppointmentReservation(appointment('CONFIRMADA', '2026-11-12T15:00:00Z'), now)).toBe(false);
    expect(isActiveAppointmentReservation(appointment('CANCELADA', '2026-11-14T15:00:00Z'), now)).toBe(false);
    expect(isActiveAppointmentReservation(appointment('COMPLETADA', '2026-11-14T15:00:00Z'), now)).toBe(false);
    expect(isActiveAppointmentReservation(appointment('PENDIENTE', '2026-11-14T15:00:00Z', '2026-11-13T14:00:00Z'), now)).toBe(false);
  });

  it('cuenta únicamente reservas futuras de eventos activas', () => {
    expect(isActiveEventReservation(eventBooking('CONFIRMADA', '2026-11-14T15:00:00Z'), now)).toBe(true);
    expect(isActiveEventReservation(eventBooking('PENDIENTE', '2026-11-14T15:00:00Z'), now)).toBe(true);
    expect(isActiveEventReservation(eventBooking('CANCELADA', '2026-11-14T15:00:00Z'), now)).toBe(false);
    expect(isActiveEventReservation(eventBooking('CONFIRMADA', '2026-11-12T15:00:00Z'), now)).toBe(false);
  });
});
