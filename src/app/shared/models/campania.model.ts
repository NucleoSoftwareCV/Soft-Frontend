export type CampaignPhase = 'PROXIMA' | 'ABIERTA' | 'CERRADA';

/** Distintivo de una campaña abierta en la que participa un evento. */
export interface CampaignBadge {
  slug: string;
  label: string;
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
