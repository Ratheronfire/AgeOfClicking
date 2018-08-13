import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminResourceConfigurationComponent } from './admin-resource-configuration.component';

describe('AdminResourceConfigurationComponent', () => {
  let component: AdminResourceConfigurationComponent;
  let fixture: ComponentFixture<AdminResourceConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminResourceConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminResourceConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
