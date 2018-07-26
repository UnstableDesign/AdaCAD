import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternModal } from './pattern.modal';

describe('PatternModal', () => {
  let component: PatternModal;
  let fixture: ComponentFixture<PatternModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatternModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
