import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TInfosBaseSiteComponent } from './t-infos-base-site.component';

 

describe('TInfosBaseSiteComponent', () => {
  let component: TInfosBaseSiteComponent;
  let fixture: ComponentFixture<TInfosBaseSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TInfosBaseSiteComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TInfosBaseSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});