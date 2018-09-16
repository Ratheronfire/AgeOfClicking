import { TestBed, inject } from '@angular/core/testing';

import { TickService } from './tick.service';

describe('TickService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TickService]
    });
  });

  it('should be created', inject([TickService], (service: TickService) => {
    expect(service).toBeTruthy();
  }));
});
