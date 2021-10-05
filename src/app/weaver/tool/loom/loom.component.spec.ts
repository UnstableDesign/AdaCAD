import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoomComponent } from './loom.component';

describe('LoomComponent', () => {
  let component: LoomComponent;
  let fixture: ComponentFixture<LoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
