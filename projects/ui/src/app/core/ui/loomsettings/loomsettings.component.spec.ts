import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoomsettingsComponent } from './loomsettings.component';

describe('LoomsettingsComponent', () => {
  let component: LoomsettingsComponent;
  let fixture: ComponentFixture<LoomsettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoomsettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoomsettingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
