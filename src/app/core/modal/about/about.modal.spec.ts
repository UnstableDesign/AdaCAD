import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutModal} from './about.modal';

describe('MaterialModal', () => {
  let component: AboutModal;
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
