import { TestBed } from '@angular/core/testing';

import { InkService } from './ink.service';

describe('InkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InkService = TestBed.get(InkService);
    expect(service).toBeTruthy();
  });
});
