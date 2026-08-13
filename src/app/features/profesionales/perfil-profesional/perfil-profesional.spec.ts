import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { PerfilProfesional } from './perfil-profesional';
import { SpecialistProfileService } from '../../../services/profesionales.service';
import { OneToOneServicesService } from '../../../services/one-to-one-services.service';

describe('PerfilProfesional', () => {
  let component: PerfilProfesional;
  let fixture: ComponentFixture<PerfilProfesional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilProfesional],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['slug', 'ana-yoga']]) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: SpecialistProfileService,
          useValue: {
            resolveAssetUrl: vi.fn((url?: string | null) => url ?? ''),
            getPublicProfileBySlug: vi.fn(() => of({
              id: 1,
              slug: 'ana-yoga',
              publicName: 'Ana Yoga',
              profileCategory: 'PROFESIONALES',
              biography: 'Profesional de yoga.',
              workTopics: [],
              techniques: [],
              photoUrl: null,
              bannerUrl: null,
              whatsappPhone: null,
              phoneNumber: null,
              publicEmail: null,
              website: null,
              socialLinks: [],
              languages: [],
              galleryImages: [],
              showUpcomingEvents: true,
              showOneToOneSessions: true,
              showGallery: true,
            })),
          },
        },
        {
          provide: OneToOneServicesService,
          useValue: {
            getServicesBySpecialist: vi.fn(() => of({
              content: [],
              totalElements: 0,
              totalPages: 0,
              size: 0,
              number: 0,
            })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilProfesional);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
