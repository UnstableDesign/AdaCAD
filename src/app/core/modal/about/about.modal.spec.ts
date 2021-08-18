import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MlModal } from './Ml.component';

describe('MlModal', () => {
  let about: MlModal;
  let fixture: ComponentFixture<MlModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MlModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MlModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
