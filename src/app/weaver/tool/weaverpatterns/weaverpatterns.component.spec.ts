import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaverPatternsComponent } from './weaverpatterns.component';

describe('PatternsComponent', () => {
  let component: WeaverPatternsComponent;
  let fixture: ComponentFixture<WeaverPatternsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeaverPatternsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeaverPatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
