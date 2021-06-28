import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShuttlesComponent } from './shuttles.component';

describe('ShuttlesComponent', () => {
  let component: ShuttlesComponent;
  let fixture: ComponentFixture<ShuttlesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShuttlesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShuttlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
