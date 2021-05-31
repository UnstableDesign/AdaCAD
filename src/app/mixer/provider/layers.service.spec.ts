import { TestBed } from '@angular/core/testing';

import { LayersService } from './layers.service';

describe('LayersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LayersService = TestBed.get(LayersService);
    expect(service).toBeTruthy();
  });
});
