import { Component, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { CheckoutService, MyBooking, PaymentProcessRequest } from '../../../services/checkout.service';
import { CampaignEntrySummary } from '../../models/campania.model';

type PaymentMethod = 'TARJETA' | 'YAPE';

/** Pago con Visa o Yape de una reserva aceptada por el profesional. */
@Component({
  selector: 'app-booking-payment-dialog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './booking-payment-dialog.component.html',
  styleUrl: './booking-payment-dialog.component.css',
})
export class BookingPaymentDialogComponent {
  private readonly checkout = inject(CheckoutService);

  readonly booking = input.required<MyBooking>();
  readonly closed = output<void>();
  readonly paid = output<void>();

  readonly method = signal<PaymentMethod>('TARJETA');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
  readonly campaignEntries = signal<CampaignEntrySummary[]>([]);

  cardNumber = '';
  cardExpiration = '';
  cardCvv = '';
  cardHolderName = '';
  yapePhone = '';
  yapeOtp = '';

  onCardNumber(value: string): void {
    this.cardNumber = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
  }

  onCardExpiration(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    this.cardExpiration = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  pay(): void {
    const invalid = this.validate();
    this.error.set(invalid);
    const orderCode = this.booking().orderCode;
    if (invalid || !orderCode || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.checkout.processPayment(orderCode, this.payload()).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (result.status === 'APROBADO') {
          this.campaignEntries.set(result.campaignEntries ?? []);
          this.done.set(true);
          this.paid.emit();
        } else {
          this.error.set(result.errorMessage || 'El pago fue rechazado. Revisa los datos e inténtalo de nuevo.');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || err.error?.message || 'No se pudo procesar el pago. Inténtalo de nuevo.');
      },
    });
  }

  close(): void {
    if (!this.loading()) {
      this.closed.emit();
    }
  }

  private payload(): PaymentProcessRequest {
    return this.method() === 'TARJETA'
      ? {
          method: 'TARJETA',
          cardNumber: this.cardNumber.replace(/\s/g, ''),
          cardExpiration: this.cardExpiration,
          cardCvv: this.cardCvv,
          cardHolderName: this.cardHolderName.trim(),
        }
      : { method: 'YAPE', yapePhoneNumber: this.yapePhone, yapeOtp: this.yapeOtp };
  }

  private validate(): string | null {
    if (this.method() === 'YAPE') {
      if (!/^\d{9}$/.test(this.yapePhone)) {
        return 'El número de celular de Yape debe tener exactamente 9 dígitos.';
      }
      return /^\d{6}$/.test(this.yapeOtp) ? null : 'El código de aprobación de Yape debe tener exactamente 6 dígitos.';
    }
    const card = this.cardNumber.replace(/\s/g, '');
    if (card.length < 15 || card.length > 16) {
      return 'El número de tarjeta debe tener 15 o 16 dígitos.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardExpiration)) {
      return 'La fecha de expiración debe tener el formato MM/AA.';
    }
    if (!/^\d{3,4}$/.test(this.cardCvv)) {
      return 'El CVV debe tener 3 o 4 dígitos.';
    }
    return this.cardHolderName.trim() ? null : 'Por favor, indica el nombre del titular.';
  }
}
