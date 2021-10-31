import { TestBed } from '@angular/core/testing';

import { OpgraphService } from './opgraph.service';

describe('OpgraphService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OpgraphService = TestBed.get(OpgraphService);
    expect(service).toBeTruthy();
  });
});
