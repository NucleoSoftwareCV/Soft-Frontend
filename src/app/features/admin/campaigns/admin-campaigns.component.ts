import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowUp,
  LucideDownload,
  LucideExternalLink,
  LucideLock,
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  LucideTrophy,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { AdminCampaniasService } from '../../../services/admin-campanias.service';
import { EventosService } from '../../../services/eventos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  AdminCampaign,
  AdminCampaignEntry,
  CampaignFaq,
  CampaignStatus,
  CampaignUpsertRequest,
} from '../../../shared/models/campania.model';

type View = 'list' | 'form' | 'entries';
type StatusFilter = 'TODAS' | CampaignStatus;
type PendingKind = 'publish' | 'unpublish' | 'finish' | 'delete' | 'draw';

interface PendingAction {
  kind: PendingKind;
  campaign: AdminCampaign;
  title: string;
  description: string;
  confirmLabel: string;
}

interface SelectedEvent {
  id: number;
  title: string;
  /** Ya estaba incluida en una campaña con participaciones: no se puede quitar. */
  fixed: boolean;
}

interface CampaignForm {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  badgeLabel: string;
  heroImageUrl: string;
  prizeAmount: number | null;
  prizeCurrency: string;
  prizeDescription: string;
  participationStartsAt: string;
  participationEndsAt: string;
  drawAt: string;
  prizeActivationDeadline: string;
  participationConditions: string;
  legalTerms: string;
  maxEntriesPerCustomer: number | null;
  faqs: CampaignFaq[];
}

type DateField = 'participationStartsAt' | 'participationEndsAt' | 'drawAt' | 'prizeActivationDeadline';
const DATE_FIELDS: DateField[] = ['participationStartsAt', 'participationEndsAt', 'drawAt', 'prizeActivationDeadline'];

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  FINALIZADA: 'Finalizada',
};

const PHASE_LABELS = { PROXIMA: 'Próxima', ABIERTA: 'Abierta', CERRADA: 'Cerrada' } as const;

/** Gestión de campañas promocionales (sorteos) dentro del panel de administración. */
@Component({
  selector: 'app-admin-campaigns',
  standalone: true,
  imports: [
    FormsModule,
    ConfirmDialogComponent,
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowUp,
    LucideDownload,
    LucideExternalLink,
    LucideLock,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideTrash2,
    LucideTrophy,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './admin-campaigns.component.html',
  styleUrl: './admin-campaigns.component.css',
})
export class AdminCampaignsComponent implements OnInit, OnDestroy {
  private readonly api = inject(AdminCampaniasService);
  private readonly eventosService = inject(EventosService);
  private readonly toast = inject(ToastService);

  readonly statusLabels = STATUS_LABELS;
  readonly phaseLabels = PHASE_LABELS;
  readonly filters: StatusFilter[] = ['TODAS', 'BORRADOR', 'PUBLICADA', 'FINALIZADA'];

  readonly view = signal<View>('list');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly campaigns = signal<AdminCampaign[]>([]);
  readonly statusFilter = signal<StatusFilter>('TODAS');

  readonly filtered = computed(() => {
    const filter = this.statusFilter();
    return filter === 'TODAS' ? this.campaigns() : this.campaigns().filter((c) => c.status === filter);
  });

  /** Campañas publicadas con la participación abierta ahora mismo. */
  readonly openNow = computed(() =>
    this.campaigns().filter((c) => c.status === 'PUBLICADA' && c.phase === 'ABIERTA'),
  );

  // --- Editor -------------------------------------------------------------------------------
  readonly editing = signal<AdminCampaign | null>(null);
  readonly formError = signal<string | null>(null);
  readonly selectedEvents = signal<SelectedEvent[]>([]);
  readonly searchResults = signal<{ id: number; title: string }[]>([]);
  readonly searching = signal(false);
  form: CampaignForm = emptyForm();
  eventSearch = '';
  private slugTouched = false;
  /** Valor ISO original y su versión local, para no alterar fechas que el usuario no tocó. */
  private originalDates: Partial<Record<DateField, { iso: string; local: string }>> = {};
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  readonly locked = computed(() => this.editing()?.locked ?? false);

  // --- Participaciones ----------------------------------------------------------------------
  readonly entriesCampaign = signal<AdminCampaign | null>(null);
  readonly entries = signal<AdminCampaignEntry[]>([]);
  readonly entriesFilter = signal<'TODAS' | 'VALIDA' | 'ANULADA'>('TODAS');
  readonly visibleEntries = computed(() => {
    const filter = this.entriesFilter();
    return filter === 'TODAS' ? this.entries() : this.entries().filter((e) => e.status === filter);
  });

  // --- Confirmaciones -----------------------------------------------------------------------
  readonly pending = signal<PendingAction | null>(null);
  readonly acting = signal(false);

  ngOnInit(): void {
    this.load();
    this.searchSub = this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.trim().length < 2) {
            this.searching.set(false);
            return of([]);
          }
          this.searching.set(true);
          return this.eventosService.getEventos({ search: term.trim(), size: 8 }).pipe(
            map((page) => page.content.map((e) => ({ id: e.id, title: e.title }))),
            catchError(() => of([])),
          );
        }),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.searchResults.set(results);
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (list) => {
        this.campaigns.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err, 'No se pudieron cargar las campañas.'));
      },
    });
  }

  // ============================================================
  // ACCIONES DEL LISTADO
  // ============================================================

  canDraw(c: AdminCampaign): boolean {
    return c.status === 'PUBLICADA' && c.phase === 'CERRADA' && !c.winner && c.validTickets > 0;
  }

  ask(kind: PendingKind, campaign: AdminCampaign): void {
    const title = campaign.detail.summary.title;
    const texts: Record<PendingKind, Omit<PendingAction, 'kind' | 'campaign'>> = {
      publish: {
        title: `¿Publicar «${title}»?`,
        description: 'La campaña será visible en la web y las reservas de sus experiencias empezarán a sumar participaciones dentro del periodo configurado.',
        confirmLabel: 'Publicar',
      },
      unpublish: {
        title: `¿Volver «${title}» a borrador?`,
        description: 'Dejará de ser visible en la web. Solo es posible mientras no tenga participaciones.',
        confirmLabel: 'Volver a borrador',
      },
      finish: {
        title: `¿Finalizar «${title}» sin sorteo?`,
        description: 'La campaña se cierra definitivamente: no admitirá cambios ni nuevas participaciones y ya no se podrá sortear desde la plataforma.',
        confirmLabel: 'Finalizar',
      },
      delete: {
        title: `¿Eliminar «${title}»?`,
        description: 'Se borrará la campaña en borrador y su configuración. Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
      },
      draw: {
        title: `¿Realizar el sorteo de «${title}»?`,
        description: `Se elegirá al azar una participación válida entre ${campaign.validTickets} papeletas (cada plaza confirmada es una papeleta). La campaña quedará finalizada y el resultado no se puede repetir.`,
        confirmLabel: 'Realizar sorteo',
      },
    };
    this.pending.set({ kind, campaign, ...texts[kind] });
  }

  confirmPending(): void {
    const action = this.pending();
    if (!action) {
      return;
    }
    const id = action.campaign.id;
    const request: Observable<AdminCampaign | void> = {
      publish: () => this.api.updateStatus(id, 'PUBLICADA'),
      unpublish: () => this.api.updateStatus(id, 'BORRADOR'),
      finish: () => this.api.updateStatus(id, 'FINALIZADA'),
      delete: () => this.api.delete(id),
      draw: () => this.api.draw(id),
    }[action.kind]();

    this.acting.set(true);
    request.subscribe({
      next: (updated) => {
        this.acting.set(false);
        this.pending.set(null);
        if (action.kind === 'delete') {
          this.campaigns.update((list) => list.filter((c) => c.id !== id));
          this.toast.success('Campaña eliminada.');
          return;
        }
        const campaign = updated as AdminCampaign;
        this.replace(campaign);
        this.toast.success(
          action.kind === 'draw' && campaign.winner
            ? `Sorteo realizado: ganó ${campaign.winner.customerName}.`
            : 'Campaña actualizada.',
        );
      },
      error: (err) => {
        this.acting.set(false);
        this.pending.set(null);
        this.toast.error(errorMessage(err, 'No se pudo completar la acción.'));
      },
    });
  }

  private replace(updated: AdminCampaign): void {
    this.campaigns.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
  }

  // ============================================================
  // EDITOR
  // ============================================================

  openNew(): void {
    this.editing.set(null);
    this.form = emptyForm();
    this.slugTouched = false;
    this.originalDates = {};
    this.selectedEvents.set([]);
    this.resetEditorState();
    this.view.set('form');
  }

  openEdit(c: AdminCampaign): void {
    const d = c.detail;
    this.editing.set(c);
    this.slugTouched = true;
    this.originalDates = {};
    const iso: Record<DateField, string | null> = {
      participationStartsAt: d.summary.participationStartsAt,
      participationEndsAt: d.summary.participationEndsAt,
      drawAt: d.summary.drawAt,
      prizeActivationDeadline: d.prizeActivationDeadline,
    };
    for (const field of DATE_FIELDS) {
      const value = iso[field];
      if (value) {
        this.originalDates[field] = { iso: value, local: toLocalInput(value) };
      }
    }
    this.form = {
      slug: d.summary.slug,
      title: d.summary.title,
      subtitle: d.summary.subtitle ?? '',
      description: d.description,
      badgeLabel: d.summary.badgeLabel,
      heroImageUrl: d.summary.heroImageUrl ?? '',
      prizeAmount: d.summary.prizeAmount,
      prizeCurrency: d.summary.prizeCurrency,
      prizeDescription: d.prizeDescription ?? '',
      participationStartsAt: this.originalDates.participationStartsAt?.local ?? '',
      participationEndsAt: this.originalDates.participationEndsAt?.local ?? '',
      drawAt: this.originalDates.drawAt?.local ?? '',
      prizeActivationDeadline: this.originalDates.prizeActivationDeadline?.local ?? '',
      participationConditions: d.participationConditions ?? '',
      legalTerms: d.legalTerms ?? '',
      maxEntriesPerCustomer: d.maxEntriesPerCustomer,
      faqs: d.faqs.map((f) => ({ ...f })),
    };
    this.selectedEvents.set(c.events.map((e) => ({ id: e.id, title: e.title, fixed: c.locked })));
    this.resetEditorState();
    this.view.set('form');
  }

  backToList(): void {
    this.view.set('list');
    this.editing.set(null);
    this.entriesCampaign.set(null);
  }

  onTitleChange(title: string): void {
    this.form.title = title;
    if (!this.slugTouched && !this.editing()) {
      this.form.slug = slugify(title);
    }
  }

  onSlugChange(slug: string): void {
    this.slugTouched = true;
    this.form.slug = slug;
  }

  addFaq(): void {
    this.form.faqs = [...this.form.faqs, { question: '', answer: '' }];
  }

  removeFaq(index: number): void {
    this.form.faqs = this.form.faqs.filter((_, i) => i !== index);
  }

  moveFaq(index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= this.form.faqs.length) {
      return;
    }
    const faqs = [...this.form.faqs];
    [faqs[index], faqs[target]] = [faqs[target], faqs[index]];
    this.form.faqs = faqs;
  }

  onEventSearch(term: string): void {
    this.eventSearch = term;
    this.search$.next(term);
  }

  addEvent(event: { id: number; title: string }): void {
    if (this.selectedEvents().some((e) => e.id === event.id)) {
      return;
    }
    this.selectedEvents.update((list) => [...list, { ...event, fixed: false }]);
  }

  isSelected(id: number): boolean {
    return this.selectedEvents().some((e) => e.id === id);
  }

  removeEvent(id: number): void {
    this.selectedEvents.update((list) => list.filter((e) => e.id !== id || e.fixed));
  }

  save(): void {
    this.formError.set(null);
    const validation = this.validate();
    if (validation) {
      this.formError.set(validation);
      return;
    }
    const request = this.toRequest();
    const current = this.editing();
    const eventIds = this.selectedEvents().map((e) => e.id);
    const eventsChanged = !current || !sameIds(current.eventIds, eventIds);

    this.saving.set(true);
    const save$ = current ? this.api.update(current.id, request) : this.api.create(request);
    save$
      .pipe(switchMap((saved) => (eventsChanged ? this.api.replaceEvents(saved.id, eventIds) : of(saved))))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          if (current) {
            this.replace(saved);
          } else {
            this.campaigns.update((list) => [saved, ...list]);
          }
          this.toast.success(current ? 'Campaña guardada.' : 'Campaña creada como borrador.');
          this.backToList();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(errorMessage(err, 'No se pudo guardar la campaña.'));
          // Si la campaña se creó pero falló la asignación de experiencias, refrescamos el listado.
          this.load();
        },
      });
  }

  private validate(): string | null {
    const f = this.form;
    if (!f.title.trim() || !f.slug.trim() || !f.description.trim()) {
      return 'Completa el título, el slug y la descripción.';
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) {
      return 'El slug solo admite minúsculas, números y guiones (p. ej. sorteo-navidad).';
    }
    if (!f.prizeAmount || f.prizeAmount <= 0) {
      return 'El premio debe ser mayor que cero.';
    }
    if (!f.participationStartsAt || !f.participationEndsAt) {
      return 'Indica el inicio y el cierre de la participación.';
    }
    if (f.participationEndsAt <= f.participationStartsAt) {
      return 'El cierre de la participación debe ser posterior al inicio.';
    }
    if (f.drawAt && f.drawAt < f.participationEndsAt) {
      return 'La fecha del sorteo no puede ser anterior al cierre de la participación.';
    }
    if (f.faqs.some((faq) => !faq.question.trim() || !faq.answer.trim())) {
      return 'Cada pregunta frecuente necesita pregunta y respuesta.';
    }
    return null;
  }

  private toRequest(): CampaignUpsertRequest {
    const f = this.form;
    return {
      slug: f.slug.trim(),
      title: f.title.trim(),
      subtitle: blankToNull(f.subtitle),
      description: f.description.trim(),
      badgeLabel: blankToNull(f.badgeLabel),
      heroImageUrl: blankToNull(f.heroImageUrl),
      prizeAmount: Number(f.prizeAmount),
      prizeCurrency: (f.prizeCurrency || 'EUR').toUpperCase(),
      prizeDescription: blankToNull(f.prizeDescription),
      participationStartsAt: this.dateValue('participationStartsAt')!,
      participationEndsAt: this.dateValue('participationEndsAt')!,
      drawAt: this.dateValue('drawAt'),
      prizeActivationDeadline: this.dateValue('prizeActivationDeadline'),
      participationConditions: blankToNull(f.participationConditions),
      legalTerms: blankToNull(f.legalTerms),
      maxEntriesPerCustomer: f.maxEntriesPerCustomer ? Number(f.maxEntriesPerCustomer) : null,
      faqs: f.faqs.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })),
    };
  }

  /** Devuelve el ISO original si el campo no cambió (evita perder segundos al pasar por datetime-local). */
  private dateValue(field: DateField): string | null {
    const local = this.form[field];
    if (!local) {
      return null;
    }
    const original = this.originalDates[field];
    return original && original.local === local ? original.iso : fromLocalInput(local);
  }

  private resetEditorState(): void {
    this.formError.set(null);
    this.eventSearch = '';
    this.searchResults.set([]);
  }

  // ============================================================
  // PARTICIPACIONES
  // ============================================================

  openEntries(c: AdminCampaign): void {
    this.entriesCampaign.set(c);
    this.entries.set([]);
    this.entriesFilter.set('TODAS');
    this.view.set('entries');
    this.loading.set(true);
    this.api.entries(c.id).subscribe({
      next: (list) => {
        this.entries.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err, 'No se pudieron cargar las participaciones.'));
      },
    });
  }

  exportCsv(): void {
    const campaign = this.entriesCampaign();
    if (!campaign) {
      return;
    }
    const header = ['Código', 'Reserva', 'Cliente', 'Email', 'Experiencia', 'Papeletas', 'Estado', 'Registrada', 'Anulada', 'Motivo'];
    const rows = this.visibleEntries().map((e) => [
      e.code, e.bookingCode, e.customerName, e.customerEmail, e.eventTitle, String(e.ticketCount),
      e.status, e.createdAt, e.voidedAt ?? '', e.voidReason ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `participaciones-${campaign.detail.summary.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // FORMATO
  // ============================================================

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: CAMPAIGN_TIME_ZONE,
    }).format(new Date(iso));
  }

  formatPrize(c: AdminCampaign): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: c.detail.summary.prizeCurrency || 'EUR',
      maximumFractionDigits: 0,
    }).format(c.detail.summary.prizeAmount);
  }
}

function emptyForm(): CampaignForm {
  return {
    slug: '', title: '', subtitle: '', description: '', badgeLabel: 'Participa en el sorteo', heroImageUrl: '',
    prizeAmount: null, prizeCurrency: 'EUR', prizeDescription: '',
    participationStartsAt: '', participationEndsAt: '', drawAt: '', prizeActivationDeadline: '',
    participationConditions: '', legalTerms: '', maxEntriesPerCustomer: null, faqs: [],
  };
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Las fechas de campaña se editan y se muestran en hora de España, sea cual sea la zona del navegador. */
export const CAMPAIGN_TIME_ZONE = 'Europe/Madrid';

const zonedFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPAIGN_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function zonedParts(epochMs: number): Record<string, number> {
  return Object.fromEntries(
    zonedFormat.formatToParts(new Date(epochMs))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  );
}

/** Diferencia (ms) entre la hora de pared de Madrid y UTC en ese instante. */
function zoneOffset(epochMs: number): number {
  const p = zonedParts(epochMs);
  return Date.UTC(p['year'], p['month'] - 1, p['day'], p['hour'], p['minute']) - Math.floor(epochMs / 60000) * 60000;
}

/** ISO → valor de `<input type="datetime-local">` en hora de Madrid. */
export function toLocalInput(iso: string): string {
  const p = zonedParts(new Date(iso).getTime());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p['year']}-${pad(p['month'])}-${pad(p['day'])}T${pad(p['hour'])}:${pad(p['minute'])}`;
}

/** Valor de `datetime-local` interpretado como hora de Madrid → ISO UTC. */
export function fromLocalInput(local: string): string {
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi);
  const first = wall - zoneOffset(wall);
  return new Date(wall - zoneOffset(first)).toISOString();
}

function blankToNull(value: string): string | null {
  return value && value.trim() ? value.trim() : null;
}

function sameIds(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);
}

function csvCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (Array.isArray(body?.errors) && body.errors[0]?.message) {
      return body.errors[0].message;
    }
    return body?.detail || body?.message || fallback;
  }
  return fallback;
}
