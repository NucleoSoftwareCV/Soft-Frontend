import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleEvento } from './detalle-evento';

describe('DetalleEvento', () => {
  let component: DetalleEvento;
  let fixture: ComponentFixture<DetalleEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleEvento],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEvento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
