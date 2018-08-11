import { TestBed, inject } from '@angular/core/testing';

import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResourcesService]
    });
  });

  it('should be created', inject([ResourcesService], (service: ResourcesService) => {
    expect(service).toBeTruthy();
  }));
});
