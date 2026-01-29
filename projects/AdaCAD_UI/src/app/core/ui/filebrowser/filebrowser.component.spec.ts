import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilebrowserComponent } from './filebrowser.component';

describe('FilebrowserComponent', () => {
  let component: FilebrowserComponent;
  let fixture: ComponentFixture<FilebrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilebrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilebrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
