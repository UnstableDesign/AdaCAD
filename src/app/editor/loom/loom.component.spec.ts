import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoomComponent } from '../settings/settings.component';

describe('LoomComponent', () => {
  let component: LoomComponent;
  let fixture: ComponentFixture<LoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoomComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
