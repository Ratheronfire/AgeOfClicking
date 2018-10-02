import { Component, OnInit } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourceType, ResourceEnum } from '../../objects/resourceData';
import { Worker } from '../../objects/worker';
import { ResourcesService } from '../../services/resources/resources.service';
import { WorkersService } from '../../services/workers/workers.service';
import { TooltipService } from './../../services/tooltip/tooltip.service';
import { AdminService } from '../../services/admin/admin.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected tooltipService: TooltipService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  getWorkers(filterByAccessible: boolean, filterByWorkable: boolean, filterByHarvestable: boolean): Worker[] {
    return this.workersService.getWorkers(filterByAccessible, filterByWorkable, filterByHarvestable);
  }

  public getWorker(resourceType: ResourceType) {
    return this.workersService.workers.get(resourceType);
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.resourcesService.resources.get(resourceEnum);
  }

  getAccessibleResourceWorkers(worker: Worker) {
    return worker.getResourceWorkers(true);
  }

  canAffordToHarvest(resourceEnum: ResourceEnum): boolean {
    return this.workersService.getWorker(resourceEnum).canAffordToHarvest(resourceEnum);
  }

  canHarvest(resourceEnum: ResourceEnum): boolean {
    return this.resourcesService.resources.get(resourceEnum).canHarvest() && this.canAffordToHarvest(resourceEnum);
  }

  shouldShowResource(resourceEnum: ResourceEnum): boolean {
    const resource = this.resourcesService.resources.get(resourceEnum);
    const resourceWorker = this.workersService.getResourceWorker(resourceEnum);

    return (resourceWorker.workable && resource.harvestable) || !this.adminService.filterAccessible;
  }

  getTooltipMessage(resourceEnum: ResourceEnum): string {
    return this.tooltipService.getWorkerTooltip(resourceEnum);
  }

  checkSliderValue(eventOrEnum: any | string) {
    const resourceEnum = typeof(eventOrEnum) === 'string' ? eventOrEnum : eventOrEnum.source._elementRef.nativeElement.id;

    const resource = this.resourcesService.resources.get(resourceEnum);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = this.workersService.getResourceWorker(resourceEnum);

    const newValue = typeof(eventOrEnum) === 'string' ? resourceWorker.sliderSetting : +eventOrEnum.value;

    resourceWorker.sliderSettingValid = worker.freeWorkers + resourceWorker.workerCount - newValue >= 0;
  }

  updateResourceWorker(eventOrEnum: any | string, value = -1) {
    const resourceEnum = typeof(eventOrEnum) === 'string' ? eventOrEnum : eventOrEnum.source._elementRef.nativeElement.id;
    if (value === -1) {
      value = +eventOrEnum.value;
    }

    this.workersService.getWorker(resourceEnum).updateResourceWorker(resourceEnum, value);
  }

  pathAvailable(resourceEnum: ResourceEnum): boolean {
    return this.resourcesService.resources.get(resourceEnum).pathAvailable;
  }

  get workersPaused(): boolean {
    return this.workersService.workersPaused;
  }

  set workersPaused(value: boolean) {
    this.workersService.workersPaused = value;
  }

  get foodStockpile(): number {
    return this.workersService.foodStockpile;
  }

  get foodCapacity(): number {
    return this.workersService.foodCapacity;
  }

  get foodPercentage(): number {
    return Math.floor(this.workersService.foodStockpile / this.workersService.foodCapacity * 100);
  }
}
