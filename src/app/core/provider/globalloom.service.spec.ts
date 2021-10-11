import { TestBed } from '@angular/core/testing';

import { GloballoomService } from './globalloom.service';

describe('GloballoomService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GloballoomService = TestBed.get(GloballoomService);
    expect(service).toBeTruthy();
  });
});
