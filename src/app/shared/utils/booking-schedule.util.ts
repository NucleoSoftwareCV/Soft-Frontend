import type { MyBooking } from '../../services/checkout.service';

function isScheduledStatus(status: MyBooking['status']): boolean {
  return ['PENDIENTE', 'PENDING', 'ACEPTADA', 'CONFIRMADA', 'CONFIRMED'].includes(status);
}

export function isActiveEventReservation(booking: MyBooking, now = Date.now()): boolean {
  return isScheduledStatus(booking.status) && Date.parse(booking.occurrenceStartsAt) > now;
}

export function getScheduledBookings(bookings: readonly MyBooking[]) {
  return bookings
    .filter(({ status }) => isScheduledStatus(status))
    .map(booking => ({ booking, date: new Date(booking.occurrenceStartsAt) }))
    .filter(({ date }) => Number.isFinite(date.getTime()))
    .sort((first, second) => first.date.getTime() - second.date.getTime());
}
