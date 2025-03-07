import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyntheseSiteComponent } from './synthese-site.component';

describe('SyntheseSiteComponent', () => {
  let component: SyntheseSiteComponent;
  let fixture: ComponentFixture<SyntheseSiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SyntheseSiteComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SyntheseSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});