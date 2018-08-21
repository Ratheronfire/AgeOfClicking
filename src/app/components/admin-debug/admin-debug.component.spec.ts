import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDebugComponent } from './admin-debug.component';

describe('AdminDebugComponent', () => {
  let component: AdminDebugComponent;
  let fixture: ComponentFixture<AdminDebugComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminDebugComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
