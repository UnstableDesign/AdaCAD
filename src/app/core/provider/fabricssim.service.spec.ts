import { TestBed } from '@angular/core/testing';

import { FabricssimService } from './fabricssim.service';

describe('FabricssimService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FabricssimService = TestBed.get(FabricssimService);
    expect(service).toBeTruthy();
  });
});
