import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionnaireSimplifieComponent } from './questionnaire-simplifie.component';



describe('QuestionnaireSimplifieComponent', () => {
  let component: QuestionnaireSimplifieComponent;
  let fixture: ComponentFixture<QuestionnaireSimplifieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuestionnaireSimplifieComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnaireSimplifieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});