import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftviewerComponent } from './draftviewer.component';

describe('DraftviewerComponent', () => {
  let component: DraftviewerComponent;
  let fixture: ComponentFixture<DraftviewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraftviewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraftviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
