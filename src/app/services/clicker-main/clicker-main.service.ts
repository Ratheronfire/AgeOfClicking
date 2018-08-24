import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { WorkersService } from '../workers/workers.service';
import { AdminService } from '../admin/admin.service';
import { Resource, ResourceType } from '../../objects/resource';

@Injectable({
  providedIn: 'root'
})
export class ClickerMainService {
  progressBarMode = 'determinate';

  millisecondsTotal = 1000;
  harvestStartDate: number;
  progressBarUpdateDelay = 200;

  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected adminService: AdminService) {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.workersService.processWorkers());

    const progressBarTimer = timer(0, this.progressBarUpdateDelay);
    progressBarTimer.subscribe(_ => this.updateProgressBars());
  }

  startHarvesting(id: number) {
    const resource = this.resourcesService.getResource(id);
    resource.harvestStartDate = Date.now();

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

  updateProgressBars() {
    for (const resource of this.resourcesService.resources.filter(_resource => _resource.harvesting)) {
      resource.progressBarValue = Math.floor((Date.now() - resource.harvestStartDate) / resource.harvestMilliseconds * 100);
    }
  }

  shouldAnimateProgressBar(id: number): boolean {
    return this.resourcesService.getResource(id).harvestMilliseconds > this.progressBarUpdateDelay;
  }

  harvestResource(id: number) {
    this.resourcesService.harvestResource(id);

    this.harvestStartDate = Date.now();

    if (this.shouldAnimateProgressBar(id)) {
      this.resourcesService.getResource(id).progressBarValue = 0;
    }

    this.stopHarvesting(id);
  }
}
