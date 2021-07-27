import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixerInitComponent } from './mixerinit.component';

describe('MixerInitComponent', () => {
  let component: MixerInitComponent;
  let fixture: ComponentFixture<MixerInitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixerInitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixerInitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
