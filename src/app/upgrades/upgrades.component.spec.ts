import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradesComponent } from './upgrades.component';

describe('UpgradesComponent', () => {
  let component: UpgradesComponent;
  let fixture: ComponentFixture<UpgradesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
