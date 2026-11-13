import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CampaignEntrySummary } from '../shared/models/campania.model';

export interface CheckoutAttendee {
  name: string;
  lastName: string;
  email: string;
}

export interface CheckoutItem {
  referenceId: number;
  itemType: 'EVENTO' | 'SESION';
  quantity: number;
  attendees?: CheckoutAttendee[];
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  billingName?: string;
  billingAddress?: string;
}

export interface CheckoutResponse {
  code: string;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  currency: string;
  status: string;
  items: any[];
}

export interface PaymentProcessRequest {
  method: 'TARJETA' | 'YAPE';
  cardNumber?: string;
  cardExpiration?: string;
  cardCvv?: string;
  cardHolderName?: string;
  yapePhoneNumber?: string;
  yapeOtp?: string;
}

export interface PaymentResponse {
  status: 'APROBADO' | 'RECHAZADO';
  externalReference: string | null;
  errorMessage: string | null;
  /** Participaciones en sorteos generadas por este pago (vacía si ninguna). */
  campaignEntries?: CampaignEntrySummary[];
}

export interface MyBooking {
  code: string;
  /** Código con el que se paga la reserva. */
  orderCode?: string | null;
  occurrenceId?: number;
  /** Solo en reservas aceptadas: límite para pagar antes de que se libere la plaza. */
  paymentDeadline?: string | null;
  status: 'PENDIENTE' | 'ACEPTADA' | 'CONFIRMADA' | 'CANCELADA' | string;
  quantity: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  eventId: number;
  eventTitle: string;
  occurrenceStartsAt: string;
  modality: 'ONLINE' | 'PRESENCIAL';
  locationName: string | null;
  cityName: string | null;
  cancelledAt?: string | null;
  /** RECHAZADA: la rechazó el profesional. CLIENTE: la canceló el cliente. EXPIRADA: venció su plazo. */
  cancellationCause?: 'RECHAZADA' | 'EXPIRADA' | 'CLIENTE' | null;
  cancellationReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/payments/checkout`;

  createOrder(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.BASE}/orders`, request);
  }

  processPayment(code: string, paymentData: PaymentProcessRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.BASE}/orders/${code}/pay`, paymentData);
  }

  getDigitalReceipt(code: string): Observable<any> {
    return this.http.get<any>(`${this.BASE}/receipts/${code}`);
  }

  getMyBookings(): Observable<MyBooking[]> {
    return this.http.get<MyBooking[]>(`${this.BASE}/bookings/me`);
  }

  cancelMyBooking(code: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/bookings/me/${encodeURIComponent(code)}/cancel`, {});
  }
}
