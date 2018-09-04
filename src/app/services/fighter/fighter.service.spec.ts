import { TestBed, inject } from '@angular/core/testing';

import { FighterService } from './fighter.service';

describe('FighterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FighterService]
    });
  });

  it('should be created', inject([FighterService], (service: FighterService) => {
    expect(service).toBeTruthy();
  }));
});
