import { AppointmentReceipt } from '../../services/appointment.service';
import { appointmentAsPayment, isActiveAppointmentReservation, isAppointmentPayable } from './perfil.component';

const NOW = Date.parse('2026-11-05T12:00:00Z');

function appointment(overrides: Partial<AppointmentReceipt> = {}): AppointmentReceipt {
  return {
    id: 7, code: 'CITA-1', serviceId: 3, title: 'Consulta individual', professionalName: 'Ana',
    customerName: 'Lucía Pérez', startsAt: '2026-11-09T14:00:00Z', endsAt: '2026-11-09T15:00:00Z',
    modality: 'ONLINE', venue: null, price: 50, currency: 'PEN', status: 'ACEPTADA',
    expiresAt: '2026-11-06T12:00:00Z', reason: 'Motivo', orderCode: 'ORD-1', paymentDeadline: '2026-11-06T12:00:00Z',
    ...overrides,
  };
}

describe('Pago de citas aceptadas', () => {
  it('permite pagar una cita aceptada con orden y plazo vigente', () => {
    expect(isAppointmentPayable(appointment(), NOW)).toBe(true);
  });

  it('no permite pagar si venció el plazo, falta la orden o aún no fue aceptada', () => {
    expect(isAppointmentPayable(appointment({ paymentDeadline: '2026-11-05T11:00:00Z' }), NOW)).toBe(false);
    expect(isAppointmentPayable(appointment({ orderCode: null }), NOW)).toBe(false);
    expect(isAppointmentPayable(appointment({ status: 'PENDIENTE' }), NOW)).toBe(false);
  });

  it('una cita aceptada sigue activa mientras dura el plazo de pago', () => {
    expect(isActiveAppointmentReservation(appointment(), NOW)).toBe(true);
    expect(isActiveAppointmentReservation(appointment({ expiresAt: '2026-11-05T11:00:00Z' }), NOW)).toBe(false);
  });

  it('reutiliza el diálogo de pago de reservas con los datos de la cita', () => {
    const payment = appointmentAsPayment(appointment());
    expect(payment.orderCode).toBe('ORD-1');
    expect(payment.eventTitle).toBe('Consulta individual');
    expect(payment.totalAmount).toBe(50);
    expect(payment.currency).toBe('PEN');
    expect(payment.paymentDeadline).toBe('2026-11-06T12:00:00Z');
    expect(payment.quantity).toBe(1);
  });
});
