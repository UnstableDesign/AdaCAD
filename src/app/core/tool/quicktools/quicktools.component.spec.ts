import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuicktoolsComponent } from './quicktools.component';

describe('QuicktoolsComponent', () => {
  let component: QuicktoolsComponent;
  let fixture: ComponentFixture<QuicktoolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuicktoolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuicktoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
