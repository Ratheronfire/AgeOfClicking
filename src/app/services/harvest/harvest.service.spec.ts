import { TestBed, inject } from '@angular/core/testing';

import { HarvestService } from './harvest.service';

describe('HarvestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HarvestService]
    });
  });

  it('should be created', inject([HarvestService], (service: HarvestService) => {
    expect(service).toBeTruthy();
  }));
});
