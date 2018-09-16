import { Injectable } from '@angular/core';

import { ClickerMainService } from './../clicker-main/clicker-main.service';
import { WorkersService } from './../workers/workers.service';
import { EnemyService } from './../enemy/enemy.service';
import { FighterService } from './../fighter/fighter.service';
import { SettingsService } from './../settings/settings.service';
import { MapService } from './../map/map.service';

declare var d3: any;

export interface Tick {
  tick(elapsed: number, deltaTime: number);
}

@Injectable({
  providedIn: 'root'
})
export class TickService {
  tickObjects = [this.clickerMainService, this.workersService, this.enemyService,
                this.fighterService, this.settingsService, this.mapService];
  timeElapsed: number;

  constructor(protected clickerMainService: ClickerMainService,
              protected workersService: WorkersService,
              protected enemyService: EnemyService,
              protected fighterService: FighterService,
              protected settingsService: SettingsService,
              protected mapService: MapService) {
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
