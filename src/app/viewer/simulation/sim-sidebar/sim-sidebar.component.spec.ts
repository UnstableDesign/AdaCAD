import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimSidebarComponent } from './sim-sidebar.component';

describe('SimSidebarComponent', () => {
  let component: SimSidebarComponent;
  let fixture: ComponentFixture<SimSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [SimSidebarComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SimSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
