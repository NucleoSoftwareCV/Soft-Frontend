import { MyBooking } from '../../services/checkout.service';

/** Estado de la reserva tal como lo lee el cliente. */
export function bookingStatusLabel(booking: Pick<MyBooking, 'status' | 'cancellationCause'>): string {
  switch (booking.status) {
    case 'PENDIENTE': return 'Pendiente de aceptación';
    case 'ACEPTADA': return 'Aceptada, pendiente de pago';
    case 'CONFIRMADA': return 'Confirmada y pagada';
    case 'CANCELADA':
      if (booking.cancellationCause === 'RECHAZADA') return 'Rechazada';
      if (booking.cancellationCause === 'EXPIRADA') return 'Vencida';
      return 'Cancelada';
    default: return booking.status;
  }
}

export interface BookingIndicator {
  status: 'ACEPTADA' | 'PENDIENTE' | 'CONFIRMADA';
  text: string;
}

/** Aviso para tarjetas y detalle: manda lo que requiere una acción del cliente. */
export function bookingIndicator(bookings: MyBooking[]): BookingIndicator | null {
  const seats = (status: string) => bookings.filter((b) => b.status === status).reduce((sum, b) => sum + b.quantity, 0);
  const withSeats = (text: string, count: number) => (count > 1 ? `${text} (${count} plazas)` : text);
  if (seats('ACEPTADA')) {
    return { status: 'ACEPTADA', text: withSeats('Tu reserva fue aceptada. Completa tu pago', seats('ACEPTADA')) };
  }
  if (seats('PENDIENTE')) {
    return { status: 'PENDIENTE', text: withSeats('Ya tienes una solicitud de reserva pendiente', seats('PENDIENTE')) };
  }
  if (seats('CONFIRMADA')) {
    return { status: 'CONFIRMADA', text: withSeats('Ya tienes una reserva confirmada', seats('CONFIRMADA')) };
  }
  return null;
}
