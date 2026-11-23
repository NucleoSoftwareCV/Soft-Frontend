import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

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

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    fixture.destroy();
    httpMock.verify({ ignoreCancelled: true });
  });

  it('abre el modal sobre el mes actual con una rejilla de 6 semanas (42 celdas)', () => {
    component.openDatePicker();

    expect(component.isDateModalOpen()).toBe(true);

    const now = new Date();
    expect(component.calendarMonth().getFullYear()).toBe(now.getFullYear());
    expect(component.calendarMonth().getMonth()).toBe(now.getMonth());

    const days = component.calendarDays();
    expect(days.length).toBe(42);
    const inMonth = days.filter(d => d.inMonth);
    expect(inMonth.length).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    const [y, m, d] = days[0].date.split('-').map(Number);
    expect(new Date(y, m - 1, d).getDay()).toBe(1);
  });

  it('muestra el título, los atajos, la rejilla y el pie en el DOM', () => {
    component.openDatePicker();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.date-modal__title')?.textContent?.trim()).toBe('Fecha');
    expect(el.querySelectorAll('.date-chip').length).toBe(filtrosService.whenOptions.length);
    expect(el.querySelector('.date-chip')?.textContent?.trim()).toBe(filtrosService.whenOptions[0]);
    expect(el.querySelectorAll('.date-calendar__day').length).toBe(42);
    expect(el.querySelector('.date-modal__clear')).toBeTruthy();
    expect(el.querySelector('.date-modal__apply')?.textContent?.trim()).toContain('Mostrar resultados');
    const weekdays = Array.from(el.querySelectorAll('.date-calendar__weekday'))
      .map(n => n.textContent?.trim());
    expect(weekdays).toEqual(['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO']);
  });

  it('centra el calendario en el mes de la fecha ya elegida (RANGO:) al abrir', () => {
    const target = new Date();
    target.setMonth(target.getMonth() + 2, 12);
    const key = isoDate(target);
    component.pendingWhen.set(`RANGO:${key}:${key}`);

    component.openDatePicker();

    expect(component.calendarMonth().getFullYear()).toBe(target.getFullYear());
    expect(component.calendarMonth().getMonth()).toBe(target.getMonth());
    expect(component.calendarDays().some(d => d.isSelected && d.date === key)).toBe(true);
    expect(component.isCustomDatePending()).toBe(true);
    expect(component.pendingDateChipLabel()).not.toBe('Elegir fecha');
  });

  it('elige un día, lo aplica como RANGO:día:día y lo envía al contador del backend', async () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    fixture.detectChanges();
    await waitForCountDebounce();
    httpMock.expectOne(r => r.url.endsWith('/events'))
      .flush({ content: [], totalElements: 129, totalPages: 0, size: 1, number: 0 });

    component.openDatePicker();
    component.nextMonth();
    const cell = component.calendarDays().find(d => d.day === 15 && d.inMonth)!;
    component.selectCalendarDay(cell);
    component.applyDateSelection();

    const expected = `RANGO:${cell.date}:${cell.date}`;
    expect(component.pendingWhen()).toBe(expected);
    expect(component.isDateModalOpen()).toBe(false);
    expect(component.isFilterOpen()).toBe(true);
    // El filtro global no cambia hasta pulsar "Mostrar resultados" en el panel de filtros.
    expect(filtrosService.filterWhen()).toBeNull();

    fixture.detectChanges();
    await waitForCountDebounce();
    const req = httpMock.expectOne(r => r.url.endsWith('/events'));
    expect(req.request.params.get('dateFrom')).toBe(cell.date);
    expect(req.request.params.get('dateTo')).toBe(cell.date);
    req.flush({ content: [], totalElements: 7, totalPages: 0, size: 1, number: 0 });

    expect(component.pendingResultsCount()).toBe(7);
    expect(component.dateButtonLabel()).toBe('Mostrar 7 experiencias');

    component.applyFilters();
    expect(filtrosService.filterWhen()).toBe(expected);
  });

  it('un segundo día posterior cierra el rango y marca todos los días intermedios', () => {
    component.openDatePicker();
    component.nextMonth();
    const days = component.calendarDays().filter(d => d.inMonth);
    component.selectCalendarDay(days[9]);
    component.selectCalendarDay(days[11]);
    component.applyDateSelection();

    expect(component.pendingWhen()).toBe(`RANGO:${days[9].date}:${days[11].date}`);
  });

  it('un segundo día anterior reinicia el inicio del rango', () => {
    component.openDatePicker();
    component.nextMonth();
    const days = component.calendarDays().filter(d => d.inMonth);
    component.selectCalendarDay(days[11]);
    component.selectCalendarDay(days[9]);

    expect(component.pendingDateFrom() && isoDate(component.pendingDateFrom()!)).toBe(days[9].date);
    expect(component.pendingDateTo()).toBeNull();
  });

  it('no permite seleccionar días pasados', () => {
    component.openDatePicker();
    const pastCell = component.calendarDays().find(d => d.isPast);
    if (!pastCell) {
      return; // Hoy es día 1 y lunes: no hay celdas pasadas en la rejilla.
    }
    component.selectCalendarDay(pastCell);
    expect(component.pendingDateFrom()).toBeNull();
  });

  it('no retrocede de mes antes del mes en curso y sí avanza', () => {
    component.openDatePicker();
    expect(component.canGoToPrevMonth()).toBe(false);

    component.nextMonth();
    expect(component.canGoToPrevMonth()).toBe(true);

    component.prevMonth();
    expect(component.canGoToPrevMonth()).toBe(false);
  });

  it('la etiqueta del mes se muestra capitalizada', () => {
    component.calendarMonth.set(new Date(2026, 8, 1));
    expect(component.monthLabel().startsWith('Septiembre')).toBe(true);
    expect(component.monthLabel()).toContain('2026');
  });

  it('los atajos ("Este finde"…) fijan el filtro CUÁNDO y cierran el modal', () => {
    component.openDatePicker();

    component.selectDateQuick('Este finde');

    expect(component.pendingWhen()).toBe('Este finde');
    expect(component.isDateModalOpen()).toBe(false);
  });

  it('"Borrar" limpia la selección de fecha', () => {
    component.openDatePicker();
    component.nextMonth();
    const cell = component.calendarDays().find(d => d.day === 15 && d.inMonth)!;
    component.selectCalendarDay(cell);
    component.applyDateSelection();
    expect(component.pendingWhen()).not.toBeNull();

    component.clearDateSelection();

    expect(component.pendingWhen()).toBeNull();
    expect(component.pendingDateFrom()).toBeNull();
    expect(component.pendingDateTo()).toBeNull();
  });

  it('aplicar sin día elegido solo cierra el modal', () => {
    component.openDatePicker();
    component.applyDateSelection();

    expect(component.isDateModalOpen()).toBe(false);
    expect(component.pendingWhen()).toBeNull();
  });

  it('Escape cierra el modal de fecha y el panel de filtros', () => {
    component.openFilter();
    flushCatalogRequests(httpMock);
    component.openDatePicker();

    component.onEscape();

    expect(component.isDateModalOpen()).toBe(false);
    expect(component.isFilterOpen()).toBe(false);
  });
});
