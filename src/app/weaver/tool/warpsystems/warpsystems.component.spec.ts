import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WarpsystemsComponent } from './warpsystems.component';

describe('WarpsystemsComponent', () => {
  let component: WarpsystemsComponent;
  let fixture: ComponentFixture<WarpsystemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WarpsystemsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarpsystemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
