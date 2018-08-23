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
  harvestTimer;
  harvestSubscribe;
  progressBarTimer;
  progressBarSubscribe;

  resourceBeingHarvested = -1;

  value = 0;
  mode = 'determinate';

  millisecondsTotal = 1000;
  harvestStartDate: number;
  progressBarUpdateDelay = 200;

  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected adminService: AdminService) {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.workersService.processWorkers());
  }

  startHarvesting(id: number) {
    const resource = this.resourcesService.getResource(id);
    this.harvestStartDate = Date.now();

    if (!this.resourcesService.canHarvest(id)) {
      return;
    }

    if (this.harvestSubscribe !== undefined) {
      this.harvestSubscribe.unsubscribe();
    }

    this.millisecondsTotal = resource.harvestMilliseconds;
    this.harvestTimer = timer(this.millisecondsTotal, this.millisecondsTotal);
    this.harvestSubscribe = this.harvestTimer.subscribe(_ => this.harvestResource(id));

    if (this.shouldAnimateProgressBar(id)) {
      this.mode = 'determinate';
      this.progressBarTimer = timer(0, this.progressBarUpdateDelay);
      this.progressBarSubscribe = this.progressBarTimer.subscribe(_ => this.updateProgressBar(id));
    } else {
      this.mode = 'indeterminate';
      this.value = 100;
    }

    this.resourceBeingHarvested = id;
  }

  stopHarvesting(id: number) {
    if (this.resourceBeingHarvested === -1) {
      return;
    }

    if (this.shouldAnimateProgressBar(id)) {
      this.progressBarSubscribe.unsubscribe();
    }

    this.harvestSubscribe.unsubscribe();

    this.value = 0;
    this.resourceBeingHarvested = -1;
  }

  updateProgressBar(id: number) {
    this.value = Math.floor((Date.now() - this.harvestStartDate) / this.millisecondsTotal * 100);
  }

  shouldAnimateProgressBar(id: number): boolean {
    return this.resourcesService.getResource(id).harvestMilliseconds > this.progressBarUpdateDelay;
  }

  harvestResource(id: number) {
    this.resourcesService.harvestResource(id);

    this.harvestStartDate = Date.now();

    if (this.shouldAnimateProgressBar(id)) {
      this.value = 0;
    }

    if (!this.resourcesService.canHarvest(id)) {
      this.stopHarvesting(id);
    }
  }
}
