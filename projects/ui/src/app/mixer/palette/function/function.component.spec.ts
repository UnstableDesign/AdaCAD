import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionComponent } from './function.component';

describe('FunctionComponent', () => {
  let component: FunctionComponent;
  let fixture: ComponentFixture<FunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FunctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FunctionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
