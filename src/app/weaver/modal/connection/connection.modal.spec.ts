import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionModal } from './connection.component';

describe('ConnectionModal', () => {
  let component: ConnectionModal;
  let fixture: ComponentFixture<ConnectionModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
