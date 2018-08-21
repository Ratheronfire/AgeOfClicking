import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickerMainComponent } from './clicker-main.component';

describe('ClickerMainComponent', () => {
  let component: ClickerMainComponent;
  let fixture: ComponentFixture<ClickerMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClickerMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClickerMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
