import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilProfesional } from './perfil-profesional';

describe('PerfilProfesional', () => {
  let component: PerfilProfesional;
  let fixture: ComponentFixture<PerfilProfesional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilProfesional],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilProfesional);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
