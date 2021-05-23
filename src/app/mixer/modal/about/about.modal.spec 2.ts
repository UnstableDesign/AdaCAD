import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutModal } from './about.modal';

describe('AboutModal', () => {
  let about: AboutModal;
  let fixture: ComponentFixture<AboutModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
