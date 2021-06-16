import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaverViewComponent } from './weaverview.component';

describe('WeaverViewComponent', () => {
  let component: WeaverViewComponent;
  let fixture: ComponentFixture<WeaverViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeaverViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeaverViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
