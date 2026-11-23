import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { NotificationsService } from '../../../services/notifications.service';
import { AppNotification } from '../../models/notification.model';
import { NotificationsInboxComponent } from './notifications-inbox.component';

describe('NotificationsInboxComponent', () => {
  const notification = (id: number, extra: Partial<AppNotification>): AppNotification => ({
    id, type: 'RESERVA_ACEPTADA', title: '¡Tu reserva fue aceptada!', message: 'Ya puedes pagar.', eventTitle: 'Yoga',
    bookingCode: 'BKG-1', actionLabel: 'Realizar pago', read: false, createdAt: '2026-11-01T10:00:00Z', ...extra,
  });
  const page = (content: AppNotification[]) => ({ content, totalElements: content.length, totalPages: 1, size: 20, number: 0 });
  const api = {
    unreadCount: signal(1),
    list: vi.fn(),
    markRead: vi.fn(() => of({})),
    markAllRead: vi.fn(() => of(undefined)),
  };
  const navigate = vi.fn();

  function render() {
    TestBed.configureTestingModule({
      imports: [NotificationsInboxComponent],
      providers: [
        { provide: NotificationsService, useValue: api },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const fixture = TestBed.createComponent(NotificationsInboxComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    api.list.mockReset();
    api.markRead.mockClear();
    api.markAllRead.mockClear();
    navigate.mockClear();
  });

  it('shows new and read notifications with their date, type and action', () => {
    api.list.mockReturnValue(of(page([notification(1, {}), notification(2, { type: 'SOLICITUD_ENVIADA', read: true, actionLabel: 'Ver mi reserva' })])));
    const el = render().nativeElement as HTMLElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('unread')).toBe(true);
    expect(items[0].textContent).toContain('Nueva');
    expect(items[0].textContent).toContain('Aceptada');
    expect(items[0].querySelector('time')).not.toBeNull();
    expect(items[0].querySelector('button')?.textContent).toContain('Realizar pago');
    expect(items[1].classList.contains('unread')).toBe(false);
  });

  it('marks as read and goes to the booking of the customer', () => {
    api.list.mockReturnValue(of(page([notification(1, {})])));
    const fixture = render();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('li button')!.click();
    fixture.detectChanges();
    expect(api.markRead).toHaveBeenCalledWith(1);
    expect(navigate).toHaveBeenCalledWith(['/perfil'], { queryParams: { tab: 'reservas', reserva: 'BKG-1' } });
    expect((fixture.nativeElement as HTMLElement).querySelector('li')?.classList.contains('unread')).toBe(false);
  });

  it('sends professional notices to the reservations of the panel', () => {
    api.list.mockReturnValue(of(page([notification(1, { type: 'NUEVA_SOLICITUD', read: true })])));
    const fixture = render();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('li button')!.click();
    expect(api.markRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/profesional'], { queryParams: { seccion: 'reservations', reserva: 'BKG-1' } });
  });

  it('marks everything as read', () => {
    api.list.mockReturnValue(of(page([notification(1, {})])));
    const fixture = render();
    fixture.componentInstance.markAllRead();
    fixture.detectChanges();
    expect(api.markAllRead).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('li.unread')).toBeNull();
  });

  it('explains an empty inbox and a failed load', () => {
    api.list.mockReturnValue(of(page([])));
    expect(render().nativeElement.textContent).toContain('Aún no tienes notificaciones');
    TestBed.resetTestingModule();
    api.list.mockReturnValue(throwError(() => new Error('down')));
    expect(render().nativeElement.textContent).toContain('No pudimos cargar');
  });
});
