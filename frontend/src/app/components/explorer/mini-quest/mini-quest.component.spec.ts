import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniQuestComponent} from './mini-quest.component';

describe('MiniQuestComponent', () => {
  let component: MiniQuestComponent;
  let fixture: ComponentFixture<MiniQuestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MiniQuestComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MiniQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});