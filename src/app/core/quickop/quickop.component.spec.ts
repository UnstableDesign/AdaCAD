import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickopComponent } from './quickop.component';

describe('QuickopComponent', () => {
  let component: QuickopComponent;
  let fixture: ComponentFixture<QuickopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickopComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
