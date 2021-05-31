import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixerPatternsComponent } from './mixerpatterns.component';

describe('MixerPatternsComponent', () => {
  let component: MixerPatternsComponent;
  let fixture: ComponentFixture<MixerPatternsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixerPatternsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixerPatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
