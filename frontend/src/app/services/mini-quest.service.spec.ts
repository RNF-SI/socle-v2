import { TestBed } from '@angular/core/testing';
import { MiniQuestService } from './mini-quest.service';
 

describe('MiniQuestService', () => {
  let service: MiniQuestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiniQuestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
