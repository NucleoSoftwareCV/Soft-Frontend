import { SpringPage } from './evento.model';

export type NotificationType =
  | 'SOLICITUD_ENVIADA' | 'RESERVA_ACEPTADA' | 'RESERVA_RECHAZADA' | 'SOLICITUD_CANCELADA'
  | 'RESERVA_CONFIRMADA' | 'RESERVA_GRATUITA_CONFIRMADA' | 'RESERVA_VENCIDA'
  | 'NUEVA_SOLICITUD' | 'CANCELACION_CLIENTE' | 'PAGO_COMPLETADO' | 'RESERVA_EXPIRADA'
  | 'CITA_SOLICITADA' | 'NUEVA_CITA_SOLICITADA' | 'CITA_CONFIRMADA'
  | 'CITA_CANCELADA_POR_CLIENTE' | 'CITA_CANCELADA_POR_PROFESIONAL'
  | 'CITA_REPROGRAMACION_SOLICITADA' | 'CITA_REPROGRAMACION_PROPUESTA'
  | 'CITA_REPROGRAMACION_ACEPTADA' | 'CITA_REPROGRAMACION_RECHAZADA' | 'CITA_COMPLETADA';

/** Los avisos del panel profesional llevan a su sección de reservas; el resto, a Mis reservas. */
export const PROFESSIONAL_NOTIFICATIONS: NotificationType[] =
  ['NUEVA_SOLICITUD', 'CANCELACION_CLIENTE', 'PAGO_COMPLETADO', 'RESERVA_EXPIRADA',
    'NUEVA_CITA_SOLICITADA', 'CITA_CANCELADA_POR_CLIENTE', 'CITA_REPROGRAMACION_SOLICITADA',
    'CITA_REPROGRAMACION_ACEPTADA', 'CITA_REPROGRAMACION_RECHAZADA'];

/** Los avisos de citas individuales se gestionan desde Agenda de citas, no desde Reservas de eventos. */
export const PROFESSIONAL_APPOINTMENT_NOTIFICATIONS: NotificationType[] =
  ['NUEVA_CITA_SOLICITADA', 'CITA_CANCELADA_POR_CLIENTE', 'CITA_REPROGRAMACION_SOLICITADA',
    'CITA_REPROGRAMACION_ACEPTADA', 'CITA_REPROGRAMACION_RECHAZADA'];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SOLICITUD_ENVIADA: 'Solicitud', RESERVA_ACEPTADA: 'Aceptada', RESERVA_RECHAZADA: 'Rechazada',
  SOLICITUD_CANCELADA: 'Cancelación', RESERVA_CONFIRMADA: 'Confirmada', RESERVA_GRATUITA_CONFIRMADA: 'Confirmada',
  RESERVA_VENCIDA: 'Vencida', NUEVA_SOLICITUD: 'Solicitud', CANCELACION_CLIENTE: 'Cancelación',
  PAGO_COMPLETADO: 'Pago', RESERVA_EXPIRADA: 'Vencida',
  CITA_SOLICITADA: 'Cita', NUEVA_CITA_SOLICITADA: 'Cita', CITA_CONFIRMADA: 'Confirmada',
  CITA_CANCELADA_POR_CLIENTE: 'Cancelación', CITA_CANCELADA_POR_PROFESIONAL: 'Cancelación',
  CITA_REPROGRAMACION_SOLICITADA: 'Reprogramación', CITA_REPROGRAMACION_PROPUESTA: 'Reprogramación',
  CITA_REPROGRAMACION_ACEPTADA: 'Reprogramación', CITA_REPROGRAMACION_RECHAZADA: 'Reprogramación',
  CITA_COMPLETADA: 'Completada',
};

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  eventTitle: string | null;
  bookingCode: string | null;
  actionLabel: string | null;
  read: boolean;
  createdAt: string;
}

export type NotificationPage = SpringPage<AppNotification>;
