import { Component, OnInit, } from '@angular/core';

import { timer } from 'rxjs';

import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';
import { WorkersService } from './../workers.service';
import { AdminService } from './../admin.service';

@Component({
  selector: 'app-clicker-main',
  templateUrl: './clicker-main.component.html',
  styleUrls: ['./clicker-main.component.css']
})
export class ClickerMainComponent implements OnInit {
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
              protected adminService: AdminService) { }

  ngOnInit() {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.workersService.processWorkers());
  }

  resourcesOfType(resourceType: string, filterByAccessible: boolean): Resource[] {
    return this.resourcesService.resourcesOfType(this.resourceTypes[resourceType], false, filterByAccessible);
  }

  public getTooltipMessage(id: number) {
    const workerCount = this.resourcesService.getResource(id).worker.workerCount;
    return this.resourcesService.resourceTooltip(id, workerCount);
  }

  startHarvesting(id: number) {
    const resource = this.resourcesService.getResource(id);
    this.harvestStartDate = Date.now();

    if (!this.resourcesService.canHarvest(id)) {
      return;
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
