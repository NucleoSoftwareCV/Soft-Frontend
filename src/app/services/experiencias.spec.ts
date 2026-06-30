import { TestBed } from '@angular/core/testing';

import { ExperienciasService } from './experiencias';

describe('Experiencias', () => {
  let service: ExperienciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperienciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
