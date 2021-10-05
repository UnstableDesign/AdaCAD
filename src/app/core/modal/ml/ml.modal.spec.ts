import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MlModal} from './ml.modal';

describe('MaterialModal', () => {
  let component: MlModal;
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});