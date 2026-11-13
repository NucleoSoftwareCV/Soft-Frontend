import { SpringPage } from './evento.model';

export type NotificationType =
  | 'SOLICITUD_ENVIADA' | 'RESERVA_ACEPTADA' | 'RESERVA_RECHAZADA' | 'SOLICITUD_CANCELADA'
  | 'RESERVA_CONFIRMADA' | 'RESERVA_GRATUITA_CONFIRMADA' | 'RESERVA_VENCIDA'
  | 'NUEVA_SOLICITUD' | 'CANCELACION_CLIENTE' | 'PAGO_COMPLETADO' | 'RESERVA_EXPIRADA';

/** Los avisos del panel profesional llevan a su sección de reservas; el resto, a Mis reservas. */
export const PROFESSIONAL_NOTIFICATIONS: NotificationType[] =
  ['NUEVA_SOLICITUD', 'CANCELACION_CLIENTE', 'PAGO_COMPLETADO', 'RESERVA_EXPIRADA'];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SOLICITUD_ENVIADA: 'Solicitud', RESERVA_ACEPTADA: 'Aceptada', RESERVA_RECHAZADA: 'Rechazada',
  SOLICITUD_CANCELADA: 'Cancelación', RESERVA_CONFIRMADA: 'Confirmada', RESERVA_GRATUITA_CONFIRMADA: 'Confirmada',
  RESERVA_VENCIDA: 'Vencida', NUEVA_SOLICITUD: 'Solicitud', CANCELACION_CLIENTE: 'Cancelación',
  PAGO_COMPLETADO: 'Pago', RESERVA_EXPIRADA: 'Vencida',
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
