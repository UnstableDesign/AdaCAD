import { TestBed } from '@angular/core/testing';

import { LoomutilsService } from './loomutils.service';

describe('LoomutilsService', () => {
  let service: LoomutilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoomutilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
