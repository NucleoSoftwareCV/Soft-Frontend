import { SpringPage } from './evento.model';

export type BookingStatus = 'PENDIENTE' | 'ACEPTADA' | 'CONFIRMADA' | 'CANCELADA' | 'LISTA_ESPERA' | 'COMPLETADA' | 'NO_ASISTIO';
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada, pendiente de pago', CONFIRMADA: 'Confirmada y pagada', CANCELADA: 'Rechazada / cancelada',
  LISTA_ESPERA: 'Lista de espera', COMPLETADA: 'Completada', NO_ASISTIO: 'No asistió',
};
export interface ProfessionalBooking {
  code: string; customerName: string; eventId: number; eventTitle: string;
  occurrenceId: number; occurrenceStartsAt: string; quantity: number; totalAmount: number;
  currency: string; status: BookingStatus; createdAt: string; paymentDeadline?: string | null;
}
export interface BookingHistory {
  previousStatus: string; newStatus: string; changedBy: string | null; reason: string | null; createdAt: string;
}
export interface ProfessionalBookingDetail {
  booking: ProfessionalBooking; customerEmail: string; customerPhone: string | null;
  capacity: number; reservedSpots: number; availableSpots: number;
  attendees: { id: number; name: string; email: string | null; attendanceStatus: string }[];
  history: BookingHistory[];
}
export interface BookingFilters { status?: BookingStatus; eventId?: number; occurrenceId?: number; page?: number; size?: number; }
export interface ProfessionalBookingPage extends SpringPage<ProfessionalBooking> { first: boolean; last: boolean; }
