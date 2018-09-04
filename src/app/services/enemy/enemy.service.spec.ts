import { TestBed, inject } from '@angular/core/testing';

import { EnemyService } from './enemy.service';

describe('EnemyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnemyService]
    });
  });

  it('should be created', inject([EnemyService], (service: EnemyService) => {
    expect(service).toBeTruthy();
  }));
});
