import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitDropdownComponent } from './unit-dropdown.component';

describe('UnitComponent', () => {
  let component: UnitDropdownComponent;
  let fixture: ComponentFixture<UnitDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitDropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
