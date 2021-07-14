import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpHelpModal } from './ophelp.modal';

describe('OpHelpModal', () => {
  let ophelpmodal: OpHelpModal;
  let fixture: ComponentFixture<OpHelpModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpHelpModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpHelpModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
