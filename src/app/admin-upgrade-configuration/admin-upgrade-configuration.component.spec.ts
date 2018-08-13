import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUpgradeConfigurationComponent } from './admin-upgrade-configuration.component';

describe('AdminUpgradeConfigurationComponent', () => {
  let component: AdminUpgradeConfigurationComponent;
  let fixture: ComponentFixture<AdminUpgradeConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUpgradeConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUpgradeConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
