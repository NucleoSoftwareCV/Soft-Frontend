import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../services/notifications.service';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-refund-decision-notice',
  standalone: true,
  imports: [RouterLink],
  template: `
    <dialog #dialog aria-labelledby="refund-notice-title">
      <h2 id="refund-notice-title">Novedades de tus reembolsos</h2>
      <ul>
        @for (item of items(); track item.id) {
          <li>
            <strong>{{ item.title }} · {{ item.eventTitle }}</strong>
            <p>{{ item.message }}</p>
            <a
              routerLink="/soporte/reembolsos"
              [queryParams]="{ solicitud: item.bookingCode }"
              (click)="open(item)"
              >Ver reembolso</a
            >
          </li>
        }
      </ul>
      <button type="button" (click)="dialog.close()">Cerrar</button>
    </dialog>
  `,
  styles: [
    `
      dialog {
        width: min(34rem, calc(100% - 2rem));
        max-height: 85dvh;
        padding: 1.25rem;
        border: 1px solid var(--line, #ddd);
        border-radius: 12px;
      }
      dialog::backdrop {
        background: rgb(0 0 0 / 45%);
      }
      li + li {
        margin-top: 1rem;
      }
      a {
        text-decoration: underline;
      }
    `,
  ],
})
export class RefundDecisionNoticeComponent {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly customerId = computed(() => {
    const user = this.auth.currentUser();
    return user?.roles?.includes('USER') ? user.id : null;
  });
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  readonly items = signal<AppNotification[]>([]);

  constructor() {
    effect((onCleanup) => {
      const dialog = this.dialog()?.nativeElement;
      const customerId = this.customerId();
      if (!this.browser || !dialog) return;
      if (dialog.open) dialog.close();
      this.items.set([]);
      if (customerId === null) return;

      const request = this.notifications.unreadRefundDecisions().subscribe({
        next: ({ content }) => {
          this.items.set(content);
          if (content.length && !dialog.open) dialog.showModal();
        },
        error: () => this.items.set([]),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  open(item: AppNotification): void {
    this.notifications.markRead(item.id).subscribe({ error: () => {} });
    this.dialog()?.nativeElement.close();
  }
}
