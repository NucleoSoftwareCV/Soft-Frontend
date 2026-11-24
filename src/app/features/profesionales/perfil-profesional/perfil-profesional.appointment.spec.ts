import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PerfilProfesional } from './perfil-profesional';
import { AuthService } from '../../../core/services/auth.service';
import { SpecialistProfileService } from '../../../services/profesionales.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { EventosService } from '../../../services/eventos.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';

describe('Acceso a citas desde un perfil publicado', () => {
  let loggedIn: boolean;
  const currentUser = signal<{ id: number } | null>(null);
  const getServicesBySpecialist = vi.fn();
  beforeEach(async () => {
    loggedIn = false; currentUser.set(null);
    await TestBed.configureTestingModule({ imports: [PerfilProfesional], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'ana-gomez' }), queryParamMap: convertToParamMap({ reservar: '1' }) }, queryParamMap: of(convertToParamMap({ reservar: '1' })) } },
      { provide: AuthService, useValue: { get isLoggedIn() { return loggedIn; }, currentUser } },
      { provide: SpecialistProfileService, useValue: {} }, { provide: ProfessionalFollowService, useValue: {} },
      { provide: EventosService, useValue: {} }, { provide: OneToOneServicesService, useValue: { getServicesBySpecialist } },
    ] }).overrideComponent(PerfilProfesional, { set: { template: '' } }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });
  function component() {
    const c = TestBed.createComponent(PerfilProfesional).componentInstance;
    c.perfil.set({ id: 7, userId: 70, slug: 'ana-gomez', tipo: 'Profesional', nombre: 'Ana', ubicacion: 'Lima', cita: '', tags: [], showOneToOneSessions: true });
    return c;
  }
  it('invita a acceder conservando el profesional y la intención', () => {
    component().reserveAppointment();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/profesionales/ana-gomez?reservar=1#citas' } });
  });
  it('con sesión activa abre los servicios sin repetir el acceso', () => {
    loggedIn = true; currentUser.set({ id: 1 }); const c = component(); c.reserveAppointment();
    expect(c.appointmentRequested()).toBe(true);
    const target = TestBed.inject(Router).createUrlTree(['/profesionales', 'ana-gomez'], { queryParams: { reservar: '1' }, fragment: 'citas' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(target);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });
  it('no permite iniciar una cita en el perfil propio o con sesiones ocultas', () => {
    loggedIn = true; currentUser.set({ id: 70 }); const c = component(); c.reserveAppointment();
    expect(c.appointmentRequested()).toBe(false);
    currentUser.set({ id: 1 }); c.perfil.update(p => p ? { ...p, showOneToOneSessions: false } : p); c.reserveAppointment();
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalled();
  });
  it('distingue un error de carga y permite reintentar sin inventar disponibilidad', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const c = component(); getServicesBySpecialist.mockReturnValue(throwError(() => new Error('sin conexión'))); c.cargarSesiones(7);
    expect(c.sessionsError()).toBe(true); expect(c.sessionsLoading()).toBe(false);
    getServicesBySpecialist.mockReturnValue(of({ content: [] })); c.cargarSesiones(7);
    expect(c.sessionsError()).toBe(false); expect(c.sesiones()).toEqual([]);
  });
});
