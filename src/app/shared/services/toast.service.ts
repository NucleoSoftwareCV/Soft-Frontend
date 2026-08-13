import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  show(text: string, type: ToastType = 'info', durationMs = 4000): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, type, text }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(text: string, durationMs?: number): void {
    this.show(text, 'success', durationMs);
  }

  error(text: string, durationMs?: number): void {
    this.show(text, 'error', durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(toast => toast.id !== id));
  }
}
