import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixerDesignComponent } from './mixerdesign.component';

describe('MixerDesignComponent', () => {
  let component: MixerDesignComponent;
  let fixture: ComponentFixture<MixerDesignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixerDesignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixerDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
