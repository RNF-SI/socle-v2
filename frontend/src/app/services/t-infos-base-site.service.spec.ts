import { TestBed } from '@angular/core/testing';
import { TInfosBaseSiteService } from './t-infos-base-site.service';
 
 

describe('TInfosBaseSiteService', () => {
  let service: TInfosBaseSiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TInfosBaseSiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
