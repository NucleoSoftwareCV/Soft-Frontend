import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SesionesComponent } from './sesiones';

describe('Sesiones', () => {
  let component: SesionesComponent;
  let fixture: ComponentFixture<SesionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SesionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SesionesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
