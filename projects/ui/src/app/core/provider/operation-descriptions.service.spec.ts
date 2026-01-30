import { TestBed } from '@angular/core/testing';

import { OperationDescriptionsService } from './operation-descriptions.service';

describe('OperationDescriptionsService', () => {
  let service: OperationDescriptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperationDescriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
