import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationsService } from '../../../services/notifications.service';
import {
  AppNotification,
  NOTIFICATION_TYPE_LABELS,
  NotificationPage,
  PROFESSIONAL_NOTIFICATIONS,
} from '../../models/notification.model';

/** Bandeja de avisos automáticos; la gestión de cada reserva sigue en su propia sección. */
@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notifications-inbox.component.html',
  styleUrl: './notifications-inbox.component.css',
})
export class NotificationsInboxComponent implements OnInit {
  private readonly api = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly typeLabels = NOTIFICATION_TYPE_LABELS;
  readonly page = signal<NotificationPage | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly unread = this.api.unreadCount;

  ngOnInit(): void {
    this.load();
  }

  load(page = 0): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(page).subscribe({
      next: (result) => {
        this.page.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus notificaciones.');
        this.loading.set(false);
      },
    });
  }

  open(notification: AppNotification): void {
    if (!notification.read) {
      this.api.markRead(notification.id).subscribe({ next: () => this.setRead(notification.id) });
    }
    if (!notification.bookingCode) {
      return;
    }
    if (PROFESSIONAL_NOTIFICATIONS.includes(notification.type)) {
      void this.router.navigate(['/profesional'], {
        queryParams: { seccion: 'reservations', reserva: notification.bookingCode },
      });
    } else {
      void this.router.navigate(['/perfil'], { queryParams: { tab: 'reservas', reserva: notification.bookingCode } });
    }
  }

  markAllRead(): void {
    this.api.markAllRead().subscribe({
      next: () => this.page.update((current) => current && {
        ...current,
        content: current.content.map((n) => ({ ...n, read: true })),
      }),
    });
  }

  private setRead(id: number): void {
    this.page.update((current) => current && {
      ...current,
      content: current.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  }
}
