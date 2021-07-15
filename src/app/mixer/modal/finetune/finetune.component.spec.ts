import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinetuneComponent } from './finetune.component';

describe('FinetuneComponent', () => {
  let component: FinetuneComponent;
  let fixture: ComponentFixture<FinetuneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinetuneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinetuneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
