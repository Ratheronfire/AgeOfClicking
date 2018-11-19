import { Injectable } from '@angular/core';

import { HarvestService } from '../harvest/harvest.service';
import { WorkersService } from './../workers/workers.service';
import { SettingsService } from './../settings/settings.service';

declare var d3: any;

export interface Tick {
  tick(elapsed: number, deltaTime: number);
}

@Injectable({
  providedIn: 'root'
})
export class TickService {
  tickObjects = [this.harvestService, this.workersService, this.settingsService];
  timeElapsed: number;

  constructor(protected harvestService: HarvestService,
              protected workersService: WorkersService,
              protected settingsService: SettingsService) {
    d3.interval(this.tick(this), 25);
  }

  tick(self: TickService) {
    return function(elapsed) {
      for (const tickObject of self.tickObjects) {
        tickObject.tick(elapsed, elapsed - self.timeElapsed);
      }

      self.timeElapsed = elapsed;
    };
  }
}
