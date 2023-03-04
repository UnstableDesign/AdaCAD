import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaverComponent } from './weaver.component';

describe('WeaverComponent', () => {
  let component: WeaverComponent;
  let fixture: ComponentFixture<WeaverComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeaverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeaverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
