import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { DetalleEvento } from './detalle-evento';
import { EventosService } from '../../../services/eventos.service';
import { ProfessionalFollowService } from '../../../services/professional-follow.service';
import { AuthService } from '../../../core/services/auth.service';

describe('DetalleEvento', () => {
  let component: DetalleEvento;
  let fixture: ComponentFixture<DetalleEvento>;
  const eventosService = {
    getEvento: vi.fn(() => of({
      id: 7,
      title: 'Respiracion consciente',
      summary: 'Un taller para respirar mejor',
      description: 'Descripcion completa',
      categoryName: 'Breathwork',
      modality: 'PRESENCIAL',
      priceFrom: 20,
      currency: 'EUR',
      organizer: { id: 3, publicName: 'Oona', whatsappPhone: '+34600111222' },
      occurrences: [],
      includes: [],
      highlights: [],
      whatToBring: [],
    })),
    getEventosSimilares: vi.fn(() => of({ content: [], totalElements: 0, number: 0, size: 12 })),
    getOtrosEventosDelOrganizador: vi.fn(() => of({ content: [], totalElements: 0, number: 0, size: 12 })),
    resolveAssetUrl: vi.fn((url: string | null | undefined) => url ?? null),
  };
  const followService = {
    getStatus: vi.fn(() => of({ professionalId: 3, following: false })),
    follow: vi.fn(() => of({ professionalId: 3, following: true })),
    unfollow: vi.fn(() => of({ professionalId: 3, following: false })),
  };
  const authService = { isLoggedIn: false, currentUser: signal(null) };
  const router = { url: '/evento/7', navigate: vi.fn() };

  beforeEach(async () => {
    eventosService.getEvento.mockClear();
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [DetalleEvento],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
        { provide: EventosService, useValue: eventosService },
        { provide: ProfessionalFollowService, useValue: followService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEvento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the public event detail from the backend service', () => {
    expect(eventosService.getEvento).toHaveBeenCalledWith(7);
    expect(eventosService.getEventosSimilares).toHaveBeenCalledWith(7);
    expect(eventosService.getOtrosEventosDelOrganizador).toHaveBeenCalledWith(7);
  });

  it('redirects unauthenticated users to login when following', () => {
    component.toggleFollow();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/evento/7' },
    });
    expect(followService.follow).not.toHaveBeenCalled();
  });

  it('builds the organizer WhatsApp link from backend data', () => {
    expect(component.whatsappUrl()).toContain('https://wa.me/34600111222');
  });
});
