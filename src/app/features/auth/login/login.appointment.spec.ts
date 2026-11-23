import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { RegisterComponent } from '../register/register.component';
import { RoleSelectionComponent } from '../role-selection/role-selection.component';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

describe('Acceso y registro conservan la cita iniciada', () => {
  const returnUrl = '/profesionales/ana-gomez?reservar=1#citas';
  let googleCallback: (token: string) => void;
  let auth: { login: ReturnType<typeof vi.fn>; loginWithGoogle: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn>; roles: string[] };
  beforeEach(async () => {
    auth = { login: vi.fn().mockReturnValue(of({ onboardingRequired: false })), loginWithGoogle: vi.fn().mockReturnValue(of({})), register: vi.fn().mockReturnValue(of({})), roles: [] };
    await TestBed.configureTestingModule({ imports: [LoginComponent, RegisterComponent, RoleSelectionComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl }) } } },
      { provide: AuthService, useValue: auth },
      { provide: GoogleIdentityService, useValue: { renderButton: (_element: HTMLElement, callback: (token: string) => void) => { googleCallback = callback; } } },
    ] }).overrideComponent(LoginComponent, { set: { template: '<div #googleBtn></div>' } })
      .overrideComponent(RegisterComponent, { set: { template: '<div #googleBtn></div>' } })
      .overrideComponent(RoleSelectionComponent, { set: { template: '' } }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });
  it('vuelve al perfil después de acceder con contraseña', () => {
    const c = TestBed.createComponent(LoginComponent).componentInstance;
    c.email.set('usuario'); c.password.set('clave-de-prueba'); c.onSubmit();
    expect(auth.login).toHaveBeenCalledWith({ username: 'usuario', password: 'clave-de-prueba' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
  });
  it('conserva el destino al completar la bienvenida obligatoria', () => {
    auth.login.mockReturnValue(of({ onboardingRequired: true }));
    const c = TestBed.createComponent(LoginComponent).componentInstance;
    c.email.set('usuario'); c.password.set('clave'); c.onSubmit();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/onboarding'], { queryParams: { returnUrl } });
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
  });
  it('Google vuelve al profesional sin crear otra autenticación', () => {
    const fixture = TestBed.createComponent(LoginComponent); fixture.detectChanges();
    googleCallback('token-de-prueba');
    expect(auth.loginWithGoogle).toHaveBeenCalledWith({ idToken: 'token-de-prueba' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
  });
  it('Google dirige una cuenta nueva a bienvenida con su destino', () => {
    auth.loginWithGoogle.mockReturnValue(of({ newlyRegistered: true }));
    const fixture = TestBed.createComponent(LoginComponent); fixture.detectChanges(); googleCallback('token-de-prueba');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/onboarding'], { queryParams: { returnUrl } });
  });
  it('respeta la elección del profesional entre sitio público y panel', () => {
    auth.roles = ['PROFESSIONAL'];
    const c = TestBed.createComponent(LoginComponent).componentInstance;
    c.email.set('usuario'); c.password.set('clave'); c.onSubmit();
    expect(c.roleChoice()).toBe(true);
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
    c.goToPublicSite(); expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
    c.goToProfessionalPanel(); expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/profesional']);
  });
  it('mantiene el destino durante el registro y la bienvenida', () => {
    const c = TestBed.createComponent(RegisterComponent).componentInstance;
    c.firstName.set('Persona'); c.email.set('persona@example.test'); c.password.set('clave-segura'); c.confirmPassword.set('clave-segura'); c.onRegisterSubmit();
    expect(auth.register).toHaveBeenCalled(); expect(auth.login).toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/onboarding'], { queryParams: { returnUrl } });
  });
  it('recupera la página de acceso correcta si falla el acceso posterior al registro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    auth.login.mockReturnValue(throwError(() => new Error('sin acceso')));
    const c = TestBed.createComponent(RegisterComponent).componentInstance;
    c.firstName.set('Persona'); c.email.set('persona@example.test'); c.password.set('clave-segura'); c.confirmPassword.set('clave-segura'); c.onRegisterSubmit();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl } });
  });
  it('permite regresar desde el registro con Google', () => {
    const fixture = TestBed.createComponent(RegisterComponent); fixture.detectChanges(); googleCallback('token-de-prueba');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(returnUrl);
  });
  it('no pierde el profesional al pasar del selector de rol al registro', () => {
    const c = TestBed.createComponent(RoleSelectionComponent).componentInstance;
    c.handleRegisterNavigation();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/register'], { queryParams: { returnUrl } });
  });
});
