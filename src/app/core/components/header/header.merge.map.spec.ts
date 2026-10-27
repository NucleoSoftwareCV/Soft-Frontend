import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { FiltrosService } from '../../../services/filtros.service';

describe('Integración del encabezado con los cambios de main', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let http: HttpTestingController;
  let filters: FiltrosService;

  function flushCatalogs(): void {
    http.match(req => /\/(categories|cities|experience-types)$/.test(req.url))
      .forEach(request => request.flush([]));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: false, currentUser: signal(null), roles: [] } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    filters = TestBed.inject(FiltrosService);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushCatalogs();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
  });

  it('conserva el menú entrante de iniciar sesión y crear cuenta', () => {
    fixture.nativeElement.querySelector('[aria-label="Menú de usuario"]').click();
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.auth-dropdown-menu a');
    expect([...links].map((link: Element) => link.getAttribute('href')))
      .toEqual(['/auth/login', '/auth/create']);
    fixture.componentInstance.onEscape();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-dropdown-menu')).toBeNull();
  });

  it('aplica y limpia profesional, precio y estado de ánimo sin perder ninguno', () => {
    filters.filterSpecialistId.set(9);
    filters.filterSpecialistName.set('Ana');
    filters.filterPrice.set('MAX:20');
    filters.filterMood.set('ENERGIA');
    const header = fixture.componentInstance;
    header.openFilter();
    flushCatalogs();
    expect(header.pendingFilterCount).toBe(3);
    expect(header.pendingMood()).toBe('ENERGIA');
    header.pendingSelectMood('Relajacion');
    header.applyFilters();
    expect(filters.buildEventFilterParams(filters.snapshot())).toMatchObject({
      mood: 'RELAJACION', specialistId: 9, maxPrice: 20,
    });
    expect(header.isFilterOpen()).toBe(false);
    header.openFilter();
    flushCatalogs();
    header.pendingClearFilters();
    header.applyFilters();
    expect(filters.activeFilterCount).toBe(0);
  });

  it('mantiene el buscador desplegable y cierra sus paneles con Escape', () => {
    const header = fixture.componentInstance;
    header.openSearch();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__search-wrap--open')).toBeTruthy();
    header.onEscape();
    fixture.detectChanges();
    expect(header.isSearchFocused()).toBe(false);
    expect(fixture.nativeElement.querySelector('.header__search-wrap--open')).toBeNull();
  });
});