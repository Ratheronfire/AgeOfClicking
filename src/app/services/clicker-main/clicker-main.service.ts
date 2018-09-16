import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { WorkersService } from '../workers/workers.service';
import { MapService } from '../map/map.service';
import { EnemyService } from './../enemy/enemy.service';
import { MessagesService } from '../messages/messages.service';
import { AdminService } from '../admin/admin.service';
import { Tick } from './../tick/tick.service';
import { Resource, ResourceType } from '../../objects/resource';
import { MessageSource } from '../../objects/message';

@Injectable({
  providedIn: 'root'
})
export class ClickerMainService implements Tick {
  timeElapsed: number;

  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected messagesService: MessagesService,
              protected adminService: AdminService) {
  }

  tick(elapsed: number, deltaTime: number) {
    this.timeElapsed = elapsed;
    for (const resource of this.resourcesService.resources.filter(_resource => _resource.harvesting)) {
      const millisecondsElapsed = elapsed - resource.harvestStartDate;
      resource.progressBarValue = Math.floor(millisecondsElapsed / resource.harvestMilliseconds * 100);
    }
  }

  startHarvesting(id: number) {
    const resource = this.resourcesService.getResource(id);
    resource.harvestStartDate = this.timeElapsed;

    if (!this.resourcesService.canHarvest(id)) {
      return;
    }

    resource.harvesting = true;

    const harvestTimer = timer(resource.harvestMilliseconds);
    harvestTimer.subscribe(_ => this.harvestResource(id));
  }

  harvestResource(id: number) {
    const resource = this.resourcesService.getResource(id);
    resource.amountTravelling++;

    this.mapService.spawnResourceAnimation(id, resource.harvestYield, true);

    if (resource.resourceTier > 3 && !this.enemyService.enemiesActive) {
      this.enemyService.enemiesActive = true;
      this.log('Your base has begun attracting unwanted attention...');
    }

    resource.progressBarValue = 0;
    resource.harvesting = false;
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Main, message);
  }
}
