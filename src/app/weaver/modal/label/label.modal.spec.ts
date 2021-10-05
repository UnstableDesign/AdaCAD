import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelModal } from './label.modal';

describe('LabelModal', () => {
  let component: LabelModal;
  let fixture: ComponentFixture<LabelModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabelModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
