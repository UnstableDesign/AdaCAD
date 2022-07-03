import { TestBed } from '@angular/core/testing';

import { CombinatoricsService } from './combinatorics.service';

describe('CombinatoricsService', () => {
  let service: CombinatoricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinatoricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
