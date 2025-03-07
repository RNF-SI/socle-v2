import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessitesComponent } from './mes-sites.component';

describe('MessitesComponent', () => {
  let component: MessitesComponent;
  let fixture: ComponentFixture<MessitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MessitesComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MessitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
