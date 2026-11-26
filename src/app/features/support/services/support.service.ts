import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  Page,
  SupportTicket,
  SupportRewardsSummary,
  RefundRequest,
  Operation,
  SupportReference,
  SupportResponse,
  SupportAttachment,
} from '../models/support.model';
@Injectable({ providedIn: 'root' })
export class SupportService {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly base = environment.apiUrl + '/support';
  get admin() {
    return this.router.url.startsWith('/admin/soporte');
  }
  get staff() {
    return this.admin;
  }
  get root() {
    return this.admin ? '/admin/soporte' : '/soporte';
  }
  get management() {
    return this.admin;
  }
  tickets(page = 0, filters: Record<string, string> = {}) {
    let params = new HttpParams().set('page', page);
    for (const [k, v] of Object.entries(filters)) if (v) params = params.set(k, v);
    return this.http.get<Page<SupportTicket>>(
      this.base + (this.management ? '/admin/tickets' : '/tickets/my'),
      { params },
    );
  }
  ticket(id: number) {
    return this.http.get<SupportTicket>(
      this.base + (this.management ? '/admin/tickets/' : '/tickets/') + id,
    );
  }
  create(body: unknown) {
    return this.http.post<SupportTicket>(this.base + '/tickets', body);
  }
  respond(id: number, body: unknown) {
    return this.http.post<SupportResponse>(
      this.base + (this.staff ? '/admin/tickets/' : '/tickets/') + id + '/responses',
      body,
    );
  }
  patchTicket(id: number, action: string, body: unknown) {
    return this.http.patch(this.base + '/admin/tickets/' + id + '/' + action, body);
  }
  reopen(id: number, reason: string) {
    return this.http.post(this.base + '/tickets/' + id + '/reopen', { reason });
  }
  upload(id: number, file: File) {
    const f = new FormData();
    f.append('file', file);
    return this.http.post<SupportAttachment>(this.base + '/tickets/' + id + '/attachments', f);
  }
  download(id: number) {
    return this.http.get(this.base + '/attachments/' + id, { responseType: 'blob' });
  }
  refunds(page = 0) {
    return this.http.get<Page<RefundRequest>>(
      this.base + (this.management ? '/admin/refunds' : '/refunds/my'),
      { params: { page } },
    );
  }
  refund(id: number) {
    return this.http.get<RefundRequest>(
      this.base + (this.management ? '/admin/refunds/' : '/refunds/') + id,
    );
  }
  createRefund(body: unknown) {
    return this.http.post<RefundRequest>(this.base + '/refunds', body);
  }
  refundAction(id: number, action: 'evaluate' | 'approve' | 'reject', body: unknown = {}) {
    return this.http.patch<RefundRequest>(this.base + '/admin/refunds/' + id + '/' + action, body);
  }
  references() {
    return this.http.get<SupportReference[]>(this.base + '/references/my');
  }
  operations() {
    return this.http.get<Operation[]>(this.base + '/operations/my');
  }
  rewards(ticketId: number, page = 0) {
    return this.http.get<SupportRewardsSummary>(
      this.base + '/admin/tickets/' + ticketId + '/rewards',
      { params: { page } },
    );
  }
  dashboard() {
    return this.http.get<Record<string, number>>(this.base + '/admin/dashboard');
  }
}
export function supportError(e: any): string {
  return (
    e?.error?.detail ||
    e?.error?.message ||
    'No se pudo completar la operación. Verifica la conexión e inténtalo de nuevo.'
  );
}
