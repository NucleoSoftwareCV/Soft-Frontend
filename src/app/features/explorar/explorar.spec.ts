import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Explorar } from './explorar';

describe('Explorar', () => {
  let component: Explorar;
  let fixture: ComponentFixture<Explorar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explorar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Explorar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
