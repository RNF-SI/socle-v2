import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FicheTerrainComponent} from './fiche-terrain.component';

describe('FicheTerrainComponent', () => {
  let component: FicheTerrainComponent;
  let fixture: ComponentFixture<FicheTerrainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FicheTerrainComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FicheTerrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});