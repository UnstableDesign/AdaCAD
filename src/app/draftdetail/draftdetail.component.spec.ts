import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftDetailComponent } from './draftdetail.component';

describe('DraftDetailComponent', () => {
  let component: DraftDetailComponent;
  let fixture: ComponentFixture<DraftDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraftDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraftDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
