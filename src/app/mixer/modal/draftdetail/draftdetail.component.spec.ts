import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftdetailComponent } from './draftdetail.component';

describe('DraftdetailComponent', () => {
  let component: DraftdetailComponent;
  let fixture: ComponentFixture<DraftdetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraftdetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraftdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
