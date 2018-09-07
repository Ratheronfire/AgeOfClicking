import { TestBed, inject } from '@angular/core/testing';

import { BuildingsService } from './buildings.service';

describe('BuildingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BuildingsService]
    });
  });

  it('should be created', inject([BuildingsService], (service: BuildingsService) => {
    expect(service).toBeTruthy();
  }));
});
