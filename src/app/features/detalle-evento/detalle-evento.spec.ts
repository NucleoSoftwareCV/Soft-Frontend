import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { DetalleEvento } from './detalle-evento';
import { EventosService } from '../../services/eventos.service';

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
      organizer: { publicName: 'Oona' },
      occurrences: [],
    })),
  };

  beforeEach(async () => {
    eventosService.getEvento.mockClear();

    await TestBed.configureTestingModule({
      imports: [DetalleEvento],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '7']]) } } },
        { provide: EventosService, useValue: eventosService },
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
  });
});
