import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminCampaniasService } from '../../../services/admin-campanias.service';
import { EventosService } from '../../../services/eventos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdminCampaign, CampaignStatus } from '../../../shared/models/campania.model';
import { AdminCampaignsComponent, fromLocalInput, slugify, toLocalInput } from './admin-campaigns.component';

describe('AdminCampaignsComponent', () => {
  const START = '2026-11-01T10:15:42.123456Z';

  function campaign(id: number, status: CampaignStatus, extra: Partial<AdminCampaign> = {}): AdminCampaign {
    return {
      id, status, phase: 'ABIERTA', eventIds: [1], events: [{ id: 1, title: 'Yoga al aire libre', status: 'PUBLICADO' }],
      entryCount: 0, validTickets: 0, participantCount: 0, locked: false, winner: null,
      createdAt: START, updatedAt: START,
      detail: {
        summary: {
          slug: `sorteo-${id}`, title: `Sorteo ${id}`, subtitle: null, badgeLabel: 'Participa en el sorteo',
          heroImageUrl: null, prizeAmount: 300, prizeCurrency: 'EUR',
          participationStartsAt: START, participationEndsAt: '2026-12-01T22:59:00Z', drawAt: null, phase: 'ABIERTA',
        },
        description: 'Descripción', prizeDescription: null, prizeActivationDeadline: null,
        participationConditions: null, legalTerms: null, maxEntriesPerCustomer: null,
        faqs: [{ question: '¿Cómo?', answer: 'Reservando.' }], eligibleEventCount: 1,
      },
      ...extra,
    };
  }

  let api: Record<string, ReturnType<typeof vi.fn>>;

  function render(list: AdminCampaign[]) {
    api = {
      list: vi.fn(() => of(list)),
      create: vi.fn((req) => of(campaign(99, 'BORRADOR', { eventIds: [] }))),
      update: vi.fn((id) => of(list.find((c) => c.id === id) ?? campaign(id, 'BORRADOR'))),
      replaceEvents: vi.fn((id) => of(campaign(id, 'BORRADOR'))),
      updateStatus: vi.fn((id, status) => of({ ...list.find((c) => c.id === id)!, status })),
      draw: vi.fn((id) => of({
        ...list.find((c) => c.id === id)!, status: 'FINALIZADA' as const,
        winner: { entryCode: 'ENT-1', bookingCode: 'BKG-1', customerName: 'Ana López', customerEmail: 'ana@x.es', ticketCount: 2, drawnAt: START },
      })),
      uploadImage: vi.fn((id) => of(campaign(id, 'BORRADOR'))),
      delete: vi.fn(() => of(undefined)),
      entries: vi.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      imports: [AdminCampaignsComponent],
      providers: [
        { provide: AdminCampaniasService, useValue: api },
        { provide: EventosService, useValue: { getEventos: vi.fn(() => of({ content: [] })) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AdminCampaignsComponent);
    fixture.detectChanges();
    return fixture;
  }

  const rows = (el: HTMLElement) => Array.from(el.querySelectorAll('tbody tr'));
  const buttons = (row: Element) => Array.from(row.querySelectorAll('button')).map((b) => b.textContent?.trim() || b.getAttribute('title'));

  it('offers the actions that each status allows', () => {
    const closed = campaign(3, 'PUBLICADA', { phase: 'CERRADA', validTickets: 4, entryCount: 2, locked: true });
    const el = render([campaign(1, 'BORRADOR'), campaign(2, 'PUBLICADA'), closed, campaign(4, 'FINALIZADA')]).nativeElement as HTMLElement;
    const [draft, published, closedRow, finished] = rows(el);

    expect(buttons(draft)).toEqual(expect.arrayContaining(['Editar', 'Publicar', 'Eliminar']));
    expect(buttons(published)).toEqual(expect.arrayContaining(['Editar', 'A borrador', 'Finalizar']));
    expect(buttons(published)).not.toContain('Realizar sorteo');
    expect(buttons(closedRow)).toContain('Realizar sorteo');
    expect(buttons(closedRow)).not.toContain('A borrador');
    expect(buttons(finished)).not.toContain('Editar');
  });

  it('filters by status and warns when several campaigns are open at once', () => {
    const fixture = render([campaign(1, 'PUBLICADA'), campaign(2, 'PUBLICADA'), campaign(3, 'BORRADOR')]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.notice')?.textContent).toContain('2 campañas abiertas');

    Array.from(el.querySelectorAll<HTMLButtonElement>('.tabs button')).find((b) => b.textContent?.includes('Borrador'))!.click();
    fixture.detectChanges();
    expect(rows(el).length).toBe(1);
    expect(rows(el)[0].textContent).toContain('Sorteo 3');
  });

  it('draws after confirmation and shows the winner', () => {
    const closed = campaign(3, 'PUBLICADA', { phase: 'CERRADA', validTickets: 4, entryCount: 2, locked: true });
    const fixture = render([closed]);
    const el = fixture.nativeElement as HTMLElement;

    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes('Realizar sorteo'))!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alertdialog"]')?.textContent).toContain('4 papeletas');
    el.querySelector<HTMLButtonElement>('.confirm-dialog__button--danger')!.click();
    fixture.detectChanges();

    expect(api['draw']).toHaveBeenCalledWith(3);
    expect(el.querySelector('.winner-line')?.textContent).toContain('Ana López');
  });

  it('locks sensitive fields and keeps untouched dates exactly as stored', async () => {
    const locked = campaign(2, 'PUBLICADA', { locked: true, entryCount: 1, validTickets: 1 });
    const fixture = render([locked]);
    const component = fixture.componentInstance;
    component.openEdit(locked);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.notice--locked')).not.toBeNull();
    expect(el.querySelector<HTMLInputElement>('input[name="slug"]')!.disabled).toBe(true);
    expect(el.querySelector('.chip button')).toBeNull();

    component.form.title = 'Nuevo título';
    component.save();
    const [, request] = api['update'].mock.calls[0];
    expect(request.participationStartsAt).toBe(START);
    expect(request.title).toBe('Nuevo título');
    expect(api['replaceEvents']).not.toHaveBeenCalled();
  });

  it('creates a draft with a slug from the title and assigns its experiences', () => {
    const fixture = render([]);
    const component = fixture.componentInstance;
    component.openNew();
    component.onTitleChange('Sorteo de Navidad ¡Gana!');
    expect(component.form.slug).toBe('sorteo-de-navidad-gana');

    component.form.description = 'Descripción';
    component.form.prizeAmount = 300;
    component.form.participationStartsAt = '2026-12-01T00:00';
    component.form.participationEndsAt = '2026-11-20T00:00';
    component.save();
    expect(component.formError()).toContain('posterior al inicio');
    expect(api['create']).not.toHaveBeenCalled();

    component.form.participationEndsAt = '2026-12-20T00:00';
    component.addEvent({ id: 7, title: 'Pilates' });
    component.save();
    expect(api['create']).toHaveBeenCalled();
    expect(api['replaceEvents']).toHaveBeenCalledWith(99, [7]);
  });

  describe('main image', () => {
    const pick = (fixture: ReturnType<typeof render>, file: File) => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      fixture.componentInstance.onImageSelected({ target: input } as unknown as Event);
      fixture.detectChanges();
    };

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:preview');
      URL.revokeObjectURL = vi.fn();
    });

    it('offers a file picker instead of a URL field and uploads the image after saving', async () => {
      const draft = campaign(2, 'BORRADOR');
      const fixture = render([draft]);
      fixture.componentInstance.openEdit(draft);
      fixture.detectChanges();
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('input[type="file"]')).not.toBeNull();
      expect(el.querySelector('input[name="heroImageUrl"]')).toBeNull();

      const file = new File(['x'], 'hero.png', { type: 'image/png' });
      pick(fixture, file);
      expect(el.querySelector<HTMLImageElement>('.image-field__preview')?.getAttribute('src')).toBe('blob:preview');

      fixture.componentInstance.save();
      expect(api['uploadImage']).toHaveBeenCalledWith(2, file);
    });

    it('rejects other formats and oversized files', () => {
      const fixture = render([]);
      const component = fixture.componentInstance;
      component.openNew();

      pick(fixture, new File(['x'], 'hero.gif', { type: 'image/gif' }));
      expect(component.formError()).toContain('JPG, PNG o WebP');

      pick(fixture, new File(['x'], 'hero.webp', { type: 'image/webp' }));
      expect(component.formError()).toBeNull();
      component.removeImage();

      pick(fixture, new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'hero.png', { type: 'image/png' }));
      expect(component.formError()).toContain('5 MB');
      expect(component.imagePreview()).toBe('');
    });

    it('removes the stored image and retries on the created campaign when the upload fails', () => {
      const stored = campaign(2, 'BORRADOR');
      stored.detail.summary.heroImageUrl = '/images/profile-images/2/campaign-hero/a.jpg';
      const fixture = render([stored]);
      const component = fixture.componentInstance;
      component.openEdit(stored);
      component.removeImage();
      component.save();
      expect(api['update'].mock.calls[0][1].heroImageUrl).toBeNull();
      expect(api['uploadImage']).not.toHaveBeenCalled();

      component.openNew();
      component.onTitleChange('Sorteo nuevo');
      component.form.description = 'Descripción';
      component.form.prizeAmount = 300;
      component.form.participationStartsAt = '2026-12-01T00:00';
      component.form.participationEndsAt = '2026-12-20T00:00';
      pick(fixture, new File(['x'], 'hero.png', { type: 'image/png' }));
      api['uploadImage'].mockReturnValueOnce(throwError(() => new Error('down')));
      component.save();
      expect(component.formError()).toBeTruthy();

      component.save();
      expect(api['create']).toHaveBeenCalledTimes(1);
      expect(api['update']).toHaveBeenCalledTimes(2);
      expect(api['uploadImage']).toHaveBeenCalledTimes(2);
    });
  });

  it('helpers build slugs and edit dates in Madrid time regardless of the browser zone', () => {
    expect(slugify('  Baño de Sonido & Yoga ')).toBe('bano-de-sonido-yoga');
    // Invierno (UTC+1) y verano (UTC+2).
    expect(toLocalInput('2026-12-20T22:00:00Z')).toBe('2026-12-20T23:00');
    expect(fromLocalInput('2026-12-20T23:00')).toBe('2026-12-20T22:00:00.000Z');
    expect(toLocalInput('2026-07-01T10:15:00Z')).toBe('2026-07-01T12:15');
    expect(fromLocalInput('2026-07-01T12:15')).toBe('2026-07-01T10:15:00.000Z');
  });
});
