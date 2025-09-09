import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftContainerComponent } from './draftcontainer.component';

describe('DraftrenderingComponent', () => {
  let component: DraftContainerComponent;
  let fixture: ComponentFixture<DraftContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DraftContainerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraftContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
