import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TileDetailComponent } from './tile-detail.component';

describe('TileDetailComponent', () => {
  let component: TileDetailComponent;
  let fixture: ComponentFixture<TileDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TileDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
