import { TestBed } from '@angular/core/testing';

import { VaeService } from './vae.service';

describe('VaeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VaeService = TestBed.get(VaeService);
    expect(service).toBeTruthy();
  });
});
