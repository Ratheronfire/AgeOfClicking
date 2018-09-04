import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FighterComponent } from './fighter.component';

describe('FighterComponent', () => {
  let component: FighterComponent;
  let fixture: ComponentFixture<FighterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FighterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FighterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
