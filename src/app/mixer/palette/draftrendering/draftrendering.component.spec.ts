import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftrenderingComponent } from './draftrendering.component';

describe('DraftrenderingComponent', () => {
  let component: DraftrenderingComponent;
  let fixture: ComponentFixture<DraftrenderingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DraftrenderingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraftrenderingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
