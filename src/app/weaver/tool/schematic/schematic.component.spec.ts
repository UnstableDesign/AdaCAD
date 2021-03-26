import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicComponent } from './schematic.component';

describe('SchematicComponent', () => {
  let component: SchematicComponent;
  let fixture: ComponentFixture<SchematicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
