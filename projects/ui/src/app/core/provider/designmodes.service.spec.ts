import { TestBed } from '@angular/core/testing';

import { DesignmodesService } from './designmodes.service';

describe('DesignmodesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DesignmodesService = TestBed.inject(DesignmodesService);
    expect(service).toBeTruthy();
  });
});
