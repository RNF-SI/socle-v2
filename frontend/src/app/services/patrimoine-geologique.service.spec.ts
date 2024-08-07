import { TestBed } from '@angular/core/testing';
import { PatrimoineGeologiqueService } from './patrimoine-geologique.service';

 

describe('PatrimoineGeologiqueService', () => {
  let service: PatrimoineGeologiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatrimoineGeologiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
