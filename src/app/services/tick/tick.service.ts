import { Injectable } from '@angular/core';

import { HarvestService } from '../harvest/harvest.service';
import { WorkersService } from './../workers/workers.service';
import { SettingsService } from './../settings/settings.service';

export interface Tick {
  tick(elapsed: number, deltaTime: number);
}

@Injectable({
  providedIn: 'root'
})
export class TickService {
  tickObjects = [this.harvestService, this.workersService, this.settingsService];
  timeElapsed = Date.now();

  constructor(protected harvestService: HarvestService,
              protected workersService: WorkersService,
              protected settingsService: SettingsService) {
    setInterval(_ => this.tick(), 25);
  }

  tick() {
    const elapsed = Date.now();

    for (const tickObject of this.tickObjects) {
      tickObject.tick(elapsed, elapsed - this.timeElapsed);
    }

    this.timeElapsed = elapsed;
  }
}
