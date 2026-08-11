import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JwtResponse } from '../../../shared/models/auth.model';

function flushCatalogRequests(httpMock: HttpTestingController): void {
  httpMock
    .match(req => req.url.endsWith('/categories') || req.url.endsWith('/experience-types') || req.url.endsWith('/cities'))
    .forEach(req => {
      if (req.request.url.endsWith('/cities')) {
        req.flush([
          { id: 1, name: 'Valencia', province: 'Valencia', countryCode: 'ES', active: true },
          { id: 2, name: 'Barcelona', province: 'Barcelona', countryCode: 'ES', active: true },
        ]);
      } else {
        req.flush([]);
      }
    });
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let toastService: ToastService;

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
    authService = TestBed.inject(AuthService);
    toastService = TestBed.inject(ToastService);

    fixture.detectChanges();
    flushCatalogRequests(httpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the first available city as the dynamic label when no city filter is selected', () => {
    expect(component.selectedCityName()).toBe('Valencia');
  });

  it('prefills the email field with the logged-in user email when the popover opens', () => {
    authService.currentUser.set({ email: 'usuaria@example.com' } as JwtResponse);

    component.toggleCity();

    expect(component.isCityOpen()).toBe(true);
    expect(component.cityInterestEmail()).toBe('usuaria@example.com');
  });

  it('closes the popover and clears state on explicit close and on Escape', () => {
    component.toggleCity();
    expect(component.isCityOpen()).toBe(true);

    component.closeCity();
    expect(component.isCityOpen()).toBe(false);

    component.toggleCity();
    component.onEscape();
    expect(component.isCityOpen()).toBe(false);
  });

  it('rejects an invalid email without calling the backend', () => {
    component.toggleCity();
    component.onCityInterestEmailInput('not-an-email');

    component.submitCityInterest();

    expect(component.cityInterestError()).toBeTruthy();
    httpMock.expectNone(req => req.url.endsWith('/city-interests'));
  });

  it('submits a valid email, shows a loading state and a success toast with the city name', () => {
    vi.spyOn(toastService, 'success');
    component.toggleCity();
    component.onCityInterestEmailInput('usuaria@example.com');

    component.submitCityInterest();
    expect(component.cityInterestSubmitting()).toBe(true);

    const req = httpMock.expectOne(r => r.url.endsWith('/city-interests'));
    expect(req.request.body).toEqual({ cityId: 1, email: 'usuaria@example.com' });
    req.flush({ message: 'ok' });

    expect(component.cityInterestSubmitting()).toBe(false);
    expect(component.isCityOpen()).toBe(false);
    expect(toastService.success).toHaveBeenCalledWith('¡Genial! Hemos guardado tu interés por Valencia');
  });

  it('shows an inline error and keeps the popover open when the backend request fails', () => {
    component.toggleCity();
    component.onCityInterestEmailInput('usuaria@example.com');

    component.submitCityInterest();
    const req = httpMock.expectOne(r => r.url.endsWith('/city-interests'));
    req.flush({ message: 'Ya has registrado tu interes por esta ciudad con este email.' }, { status: 400, statusText: 'Bad Request' });

    expect(component.cityInterestSubmitting()).toBe(false);
    expect(component.isCityOpen()).toBe(true);
    expect(component.cityInterestError()).toBe('Ya has registrado tu interes por esta ciudad con este email.');
  });
});
