export type CampaignPhase = 'PROXIMA' | 'ABIERTA' | 'CERRADA';

/** Distintivo de una campaña abierta en la que participa un evento. */
export interface CampaignBadge {
  slug: string;
  label: string;
  /** Título de la campaña, para distinguirlas cuando un evento participa en varias. */
  title?: string;
}

export interface CampaignFaq {
  question: string;
  answer: string;
}

export interface CampaignSummary {
  slug: string;
  title: string;
  subtitle: string | null;
  badgeLabel: string;
  heroImageUrl: string | null;
  prizeAmount: number;
  prizeCurrency: string;
  participationStartsAt: string;
  participationEndsAt: string;
  drawAt: string | null;
  phase: CampaignPhase;
}

export interface CampaignDetail {
  summary: CampaignSummary;
  description: string;
  /** Solo informativo: la plataforma no gestiona crédito por ahora. */
  prizeDescription: string | null;
  prizeActivationDeadline: string | null;
  participationConditions: string | null;
  legalTerms: string | null;
  maxEntriesPerCustomer: number | null;
  faqs: CampaignFaq[];
  eligibleEventCount: number;
  /** Nombre abreviado de quien ganó (p. ej. «María G.»); null hasta que se realiza el sorteo. */
  winnerDisplayName?: string | null;
  drawnAt?: string | null;
}

export interface CampaignMyEntry {
  code: string;
  bookingCode: string;
  eventId: number;
  eventTitle: string;
  occurrenceStartsAt: string;
  ticketCount: number;
  status: 'VALIDA' | 'ANULADA';
  createdAt: string;
}

export interface CampaignMyEntries {
  campaignSlug: string;
  validTickets: number;
  entries: CampaignMyEntry[];
}

/** Participación generada por un pago aprobado. */
export interface CampaignEntrySummary {
  campaignSlug: string;
  campaignTitle: string;
  bookingCode: string;
  ticketCount: number;
}

// ============================================================
// ADMINISTRACIÓN
// ============================================================

export type CampaignStatus = 'BORRADOR' | 'PUBLICADA' | 'FINALIZADA';

export interface AdminCampaignEvent {
  id: number;
  title: string;
  status: string;
}

export interface AdminCampaignWinner {
  entryCode: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  ticketCount: number;
  drawnAt: string;
}

export interface AdminCampaign {
  id: number;
  status: CampaignStatus;
  phase: CampaignPhase;
  detail: CampaignDetail;
  eventIds: number[];
  events: AdminCampaignEvent[];
  entryCount: number;
  validTickets: number;
  participantCount: number;
  /** Con participaciones: no se cambia slug, inicio ni premio, el cierre solo se amplía y no se quitan experiencias. */
  locked: boolean;
  winner: AdminCampaignWinner | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignUpsertRequest {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  badgeLabel: string | null;
  heroImageUrl: string | null;
  prizeAmount: number;
  prizeCurrency: string;
  prizeDescription: string | null;
  participationStartsAt: string;
  participationEndsAt: string;
  drawAt: string | null;
  prizeActivationDeadline: string | null;
  participationConditions: string | null;
  legalTerms: string | null;
  maxEntriesPerCustomer: number | null;
  faqs: CampaignFaq[];
}

export interface AdminCampaignEntry {
  code: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  eventId: number;
  eventTitle: string;
  ticketCount: number;
  status: 'VALIDA' | 'ANULADA';
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
}
