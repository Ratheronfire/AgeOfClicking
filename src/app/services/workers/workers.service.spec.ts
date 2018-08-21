import { TestBed, inject } from '@angular/core/testing';

import { WorkersService } from './workers.service';

describe('WorkersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkersService]
    });
  });

  it('should be created', inject([WorkersService], (service: WorkersService) => {
    expect(service).toBeTruthy();
  }));
});
