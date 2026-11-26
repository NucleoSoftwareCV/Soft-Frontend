export const CATEGORIES = [
  'PAGOS',
  'REEMBOLSOS',
  'RESERVAS',
  'EVENTOS',
  'REWARDS',
  'CANJES',
  'CUENTA',
  'PROFESIONALES',
  'TECNICO',
  'OTROS',
] as const;
export const STATUSES = [
  'PENDIENTE',
  'ASIGNADO',
  'EN_REVISION',
  'ESPERANDO_USUARIO',
  'RESUELTO',
  'CERRADO',
  'REABIERTO',
] as const;
export const PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
export interface SupportResponse {
  id: number;
  sender: string;
  senderId: number;
  message: string;
  internal: boolean;
  createdAt: string;
}
export interface SupportAttachment {
  id: number;
  fileName: string;
  contentType: string;
  createdAt: string;
}
export interface SupportHistory {
  id: number;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
}
export interface SupportTicket {
  refundRequestId?: number | null;
  bookingCode: string | null;
  sessionBookingId: number | null;
  sessionBookingCode: string | null;
  sessionTitle: string | null;
  eventTitle: string | null;
  complaintReference: string | null;
  id: number;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  userEmail: string;
  assignedUserId: number | null;
  assignedName: string | null;
  bookingId: number | null;
  eventId: number | null;
  transactionId: number | null;
  responses?: SupportResponse[];
  attachments?: SupportAttachment[];
  history?: SupportHistory[];
}
export interface RefundRequest {
  id: number;
  ticketId: number;
  ticketNumber: string;
  transactionId: number;
  originalAmount: number;
  currency: string;
  requestedAmount: number;
  approvedAmount: number | null;
  reason: string;
  observation: string | null;
  status: string;
  providerRefundId: string | null;
  processedAt: string | null;
  createdAt: string;
}
export interface Operation {
  id: number;
  orderCode: string;
  amount: number;
  currency: string;
  eligibleAmount: number;
}

export interface SupportReference {
  key: string;
  kind: 'EVENT' | 'SESSION';
  bookingId: number | null;
  sessionBookingId: number | null;
  eventId: number | null;
  title: string;
  code: string;
  startsAt: string;
  status: string;
}

export interface SupportRewardsSummary {
  balance: number;
  movements: Page<{
    id: number;
    type: 'EARN' | 'REDEEM';
    points: number;
    balanceAfter: number;
    createdAt: string;
    eventTitle: string | null;
  }>;
}

export const REFUND_REASONS: Readonly<Record<string, string>> = {
  EVENT_CANCELLED: 'Evento cancelado',
  DUPLICATE_PAYMENT: 'Pago duplicado',
  SERVICE_NOT_RECEIVED: 'Servicio no recibido',
  OTHER: 'Otro motivo',
};
