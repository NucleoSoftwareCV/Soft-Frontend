import { TestBed } from '@angular/core/testing';

import { Experiencias } from './experiencias';

describe('Experiencias', () => {
  let service: Experiencias;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Experiencias);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
