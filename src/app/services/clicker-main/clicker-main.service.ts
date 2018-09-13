import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { WorkersService } from '../workers/workers.service';
import { MapService } from '../map/map.service';
import { EnemyService } from './../enemy/enemy.service';
import { MessagesService } from '../messages/messages.service';
import { AdminService } from '../admin/admin.service';
import { Resource, ResourceType } from '../../objects/resource';
import { MessageSource } from '../../objects/message';

@Injectable({
  providedIn: 'root'
})
export class ClickerMainService {
  progressBarMode = 'determinate';

  millisecondsTotal = 1000;
  harvestStartDate: number;
  progressBarUpdateDelay = 125;
  timeElapsed: 0;

  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected messagesService: MessagesService,
              protected adminService: AdminService) {
    const progressBarTimer = timer(0, this.progressBarUpdateDelay);
    progressBarTimer.subscribe(iteration => this.updateProgressBars(iteration));
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

  stopHarvesting(id: number) {
    const resource = this.resourcesService.getResource(id);
    resource.progressBarValue = 0;
    resource.harvesting = false;
  }

  updateProgressBars(iteration) {
    for (const resource of this.resourcesService.resources.filter(_resource => _resource.harvesting)) {
      const millisecondsElapsed = (iteration - resource.harvestStartDate - 1) * this.progressBarUpdateDelay;
      resource.progressBarValue = Math.floor(millisecondsElapsed / resource.harvestMilliseconds * 100);
    }

    this.timeElapsed = iteration;
  }

  shouldAnimateProgressBar(id: number): boolean {
    return this.resourcesService.getResource(id).harvestMilliseconds > this.progressBarUpdateDelay;
  }

  harvestResource(id: number) {
    this.harvestStartDate = Date.now();
    const resource = this.resourcesService.getResource(id);
    resource.amountTravelling++;

    if (this.shouldAnimateProgressBar(id)) {
      resource.progressBarValue = 0;
    }

    this.mapService.spawnResourceAnimation(id, resource.harvestYield, true);

    if (resource.resourceTier > 3 && !this.enemyService.enemiesActive) {
      this.enemyService.enemiesActive = true;
      this.log('Your base has begun attracting unwanted attention...');
    }

    this.stopHarvesting(id);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Main, message);
  }
}
