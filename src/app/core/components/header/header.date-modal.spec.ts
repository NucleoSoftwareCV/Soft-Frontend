import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { HeaderComponent } from './header.component';
import { FiltrosService } from '../../../services/filtros.service';

function flushCatalogRequests(httpMock: HttpTestingController): void {
  httpMock
    .match(req => req.url.endsWith('/categories') || req.url.endsWith('/experience-types') || req.url.endsWith('/cities'))
    .forEach(req => req.flush([]));
}

/** Espera el debounceTime(250) del contador en vivo. */
function waitForCountDebounce(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 320));
}

function flushEventCount(httpMock: HttpTestingController, totalElements: number): void {
  const req = httpMock.expectOne(r => r.url.endsWith('/events'));
  req.flush({
    content: [],
    totalElements,
    totalPages: 0,
    size: 1,
    number: 0,
  });
}

describe('HeaderComponent – modal de fecha ("Elegir fecha")', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let httpMock: HttpTestingController;
  let filtrosService: FiltrosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    filtrosService = TestBed.inject(FiltrosService);

    fixture.detectChanges();
    flushCatalogRequests(httpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('abre el modal sobre el mes actual con una rejilla de 6 semanas (42 celdas)', () => {
    component.openDatePicker();

    expect(component.isDateModalOpen()).toBe(true);

    const now = new Date();
    expect(component.calendarView()).toEqual({ year: now.getFullYear(), month: now.getMonth() });

    const days = component.calendarDays();
    expect(days.length).toBe(42);
    const inMonth = days.filter(d => d.inMonth);
    expect(inMonth.length).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    const [y, m, d] = days[0].date.split('-').map(Number);
    expect(new Date(y, m - 1, d).getDay()).toBe(1);
  });

  it('muestra el título, los atajos y el footer con "Mostrar N experiencias" en el DOM', async () => {
    component.openDatePicker();
    await waitForCountDebounce();
    flushEventCount(httpMock, 121);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.date-modal__title')?.textContent?.trim()).toBe('Fecha');
    expect(el.querySelectorAll('.date-chip').length).toBe(3);
    expect(el.querySelector('.date-chip')?.textContent?.trim()).toBe('Esta semana');
    expect(el.querySelectorAll('.date-calendar__day').length).toBe(42);
    expect(el.querySelector('.date-modal__clear')?.textContent?.trim()).toContain('Borrar');
    expect(el.querySelector('.date-modal__apply')?.textContent?.trim()).toContain('Mostrar 121 experiencias');
    const weekdays = Array.from(el.querySelectorAll('.date-calendar__weekday'))
      .map(n => n.textContent?.trim());
    expect(weekdays).toEqual(['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO']);
  });

  it('centra el calendario en el mes de la fecha ya elegida (RANGO:) al abrir', () => {
    const target = new Date();
    target.setMonth(target.getMonth() + 2, 12);
    const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-12`;
    component.pendingWhen.set(`RANGO:${key}:${key}`);

    component.openDatePicker();

    expect(component.calendarView()).toEqual({ year: target.getFullYear(), month: target.getMonth() });
    expect(component.selectedDateKey()).toBe(key);
    expect(component.calendarDays().some(d => d.isSelected && d.date === key)).toBe(true);
  });

  it('selecciona un día → aplica RANGO:dateFrom=dateTo y envía el filtro al backend', async () => {
    component.openDatePicker();
    await waitForCountDebounce();
    flushEventCount(httpMock, 129);

    component.nextMonth();
    const cell = component.calendarDays().find(d => d.day === 15 && d.inMonth)!;
    component.selectCalendarDay(cell);

    const expected = `RANGO:${cell.date}:${cell.date}`;
    expect(component.pendingWhen()).toBe(expected);
    expect(filtrosService.filterWhen()).toBe(expected);

    await waitForCountDebounce();
    const req = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(req.request.params.get('dateFrom')).toBe(cell.date);
    expect(req.request.params.get('dateTo')).toBe(cell.date);
    req.flush({ content: [], totalElements: 7, totalPages: 0, size: 1, number: 0 });

    expect(component.resultCount()).toBe(7);
    expect(component.dateButtonLabel()).toBe('Mostrar 7 experiencias');
    expect(component.isCustomDatePending()).toBe(true);
    expect(component.pendingDateChipLabel()).not.toBe('Elegir fecha');
  });

  it('deselecciona el día al pulsarlo de nuevo (toggle)', () => {
    component.openDatePicker();
    component.nextMonth();
    const cell = component.calendarDays().find(d => d.day === 15 && d.inMonth)!;

    component.selectCalendarDay(cell);
    expect(component.pendingWhen()).toBe(`RANGO:${cell.date}:${cell.date}`);

    component.selectCalendarDay(component.calendarDays().find(d => d.day === 15 && d.inMonth)!);
    expect(component.pendingWhen()).toBeNull();
    expect(filtrosService.filterWhen()).toBeNull();
  });

  it('no permite seleccionar días pasados', () => {
    component.openDatePicker();
    const pastCell = component.calendarDays().find(d => d.isPast)!;
    component.selectCalendarDay(pastCell);
    expect(component.pendingWhen()).toBeNull();
  });

  it('no retrocede de mes antes del mes en curso y sí avanza', () => {
    component.openDatePicker();
    expect(component.canGoToPrevMonth()).toBe(false);

    component.nextMonth();
    expect(component.canGoToPrevMonth()).toBe(true);

    component.prevMonth();
    expect(component.canGoToPrevMonth()).toBe(false);
  });

  it('la etiqueta del mes se muestra capitalizada ("Septiembre 2026")', () => {
    component.calendarView.set({ year: 2026, month: 8 });
    expect(component.monthLabel()).toBe('Septiembre 2026');
  });

  it('los atajos ("Esta semana"…) alternan el filtro CUÁNDO', () => {
    component.openDatePicker();

    component.selectDateQuick('Este finde');
    expect(component.pendingWhen()).toBe('Este finde');
    expect(filtrosService.filterWhen()).toBe('Este finde');

    component.selectDateQuick('Este finde');
    expect(component.pendingWhen()).toBeNull();
  });

  it('"Borrar" limpia la selección de fecha y deshabilita el botón', () => {
    component.openDatePicker();
    component.nextMonth();
    const cell = component.calendarDays().find(d => d.day === 15 && d.inMonth)!;
    component.selectCalendarDay(cell);
    expect(component.pendingWhen()).not.toBeNull();

    component.clearDateSelection();

    expect(component.pendingWhen()).toBeNull();
    expect(filtrosService.filterWhen()).toBeNull();
  });

  it('"Mostrar N experiencias" cierra los dos modales y navega a /explorar', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.openFilter();
    flushCatalogRequests(httpMock);
    component.openDatePicker();
    await waitForCountDebounce();
    flushEventCount(httpMock, 121);
    expect(component.isFilterOpen()).toBe(true);
    expect(component.isDateModalOpen()).toBe(true);

    component.applyDateSelection();

    expect(component.isDateModalOpen()).toBe(false);
    expect(component.isFilterOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/explorar'], { queryParamsHandling: 'preserve' });

    await waitForCountDebounce();
    flushEventCount(httpMock, 121);
  });

  it('Escape cierra primero el modal de fecha sin cerrar el de filtros', () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    component.openDatePicker();

    component.onEscape();

    expect(component.isDateModalOpen()).toBe(false);
    expect(component.isFilterOpen()).toBe(true);
  });

  it('al pulsar un día de otro mes, la vista salta a ese mes', () => {
    component.openDatePicker();
    const outCell = component.calendarDays().find(d => !d.inMonth && !d.isPast)!;
    component.selectCalendarDay(outCell);

    const [y, m] = outCell.date.split('-').map(Number);
    expect(component.calendarView()).toEqual({ year: y, month: m - 1 });
  });
});
