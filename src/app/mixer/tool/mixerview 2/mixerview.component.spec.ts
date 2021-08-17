import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixerViewComponent } from './mixerview.component';

describe('ViewComponent', () => {
  let component: MixerViewComponent;
  let fixture: ComponentFixture<MixerViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixerViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixerViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
