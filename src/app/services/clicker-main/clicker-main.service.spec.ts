import { TestBed, inject } from '@angular/core/testing';

import { ClickerMainService } from './clicker-main.service';

describe('ClickerMainService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClickerMainService]
    });
  });

  it('should be created', inject([ClickerMainService], (service: ClickerMainService) => {
    expect(service).toBeTruthy();
  }));
});
