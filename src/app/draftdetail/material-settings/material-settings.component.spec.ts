import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialSettingsComponent } from './material-settings.component';

describe('MaterialSettingsComponent', () => {
  let component: MaterialSettingsComponent;
  let fixture: ComponentFixture<MaterialSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaterialSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
