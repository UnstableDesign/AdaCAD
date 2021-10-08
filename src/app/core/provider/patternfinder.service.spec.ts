import { TestBed } from '@angular/core/testing';

import { PatternfinderService } from './patternfinder.service';

describe('PatternfinderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PatternfinderService = TestBed.get(PatternfinderService);
    expect(service).toBeTruthy();
  });
});
