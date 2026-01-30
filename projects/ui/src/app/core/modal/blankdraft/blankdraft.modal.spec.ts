import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlankdraftModal } from './blankdraft.modal';

describe('BlankdraftModal', () => {
  let component: BlankdraftModal;
  let fixture: ComponentFixture<BlankdraftModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlankdraftModal ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlankdraftModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
