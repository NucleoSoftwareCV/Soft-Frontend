import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  yapePhone?: string;
  yapeOtp?: string;
}

export interface PaymentResponse {
  status: 'APROBADO' | 'RECHAZADO';
  externalReference: string | null;
  errorMessage: string | null;
}

export interface WhatsAppRedirect {
  redirectUrl: string;
}

export interface MyBooking {
  code: string;
  status: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | string;
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

  getWhatsAppLink(code: string): Observable<WhatsAppRedirect> {
    return this.http.get<WhatsAppRedirect>(`${this.BASE}/orders/${code}/whatsapp`);
  }

  getDigitalReceipt(code: string): Observable<any> {
    return this.http.get<any>(`${this.BASE}/receipts/${code}`);
  }

  getMyBookings(): Observable<MyBooking[]> {
    return this.http.get<MyBooking[]>(`${this.BASE}/bookings/me`);
  }
}
