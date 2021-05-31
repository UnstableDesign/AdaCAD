import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaverDesignComponent } from './weaverdesign.component';

describe('DesignComponent', () => {
  let component: WeaverDesignComponent;
  let fixture: ComponentFixture<WeaverDesignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeaverDesignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeaverDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
