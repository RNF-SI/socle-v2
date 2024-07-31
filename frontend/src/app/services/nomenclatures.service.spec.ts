import { TestBed } from '@angular/core/testing';

import { NomenclaturesService } from './nomenclatures.service';

describe('NomenclaturesService', () => {
  let service: NomenclaturesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NomenclaturesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
