import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeftsystemsComponent } from './weftsystems.component';

describe('WeftsystemsComponent', () => {
  let component: WeftsystemsComponent;
  let fixture: ComponentFixture<WeftsystemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeftsystemsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeftsystemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
