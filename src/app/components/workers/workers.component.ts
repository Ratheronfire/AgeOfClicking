import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
import { ResourcesService } from '../../services/resources/resources.service';
import { Worker, ResourceWorker } from '../../objects/worker';
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

  public getWorker(idOrResourceType: number | ResourceType) {
    return this.workersService.getWorker(idOrResourceType);
  }

  getAccessibleResourceWorkers(worker: Worker) {
    return worker.workersByResource.filter(rw => this.resourcesService.getResource(rw.resourceId).resourceAccessible);
  }

  canAfford(id: number): boolean {
    return this.workersService.canAffordWorker(id);
  }

  canHarvest(resourceId: number): boolean {
    return this.resourcesService.canHarvest(resourceId) && this.workersService.canAffordToHarvest(resourceId);
  }

  shouldShowResource(id: number): boolean {
    const resource = this.resourcesService.getResource(id);
    const resourceWorker = this.workersService.getResourceWorker(id);

    return (resourceWorker.workable && resource.harvestable) || !this.adminService.filterAccessible;
  }

  getTooltipMessage(id: number): string {
    return this.tooltipService.getWorkerTooltip(id);
  }

  hireWorker(id: number) {
    this.workersService.hireWorker(id);
  }

  checkSliderValue(eventOrId: any | ResourceWorker) {
    const id = typeof(eventOrId) === 'number' ? eventOrId : +eventOrId.source._elementRef.nativeElement.id;

    const resource = this.resourcesService.getResource(id);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = worker.workersByResource.find(ws => ws.resourceId === resource.id);

    const newValue = typeof(eventOrId) === 'number' ? resourceWorker.sliderSetting : +eventOrId.value;

    resourceWorker.sliderSettingValid = worker.freeWorkers + resourceWorker.workerCount - newValue >= 0;
  }

  updateResourceWorker(eventOrId: any | number, value = -1) {
    const id = typeof(eventOrId) === 'number' ? eventOrId : +eventOrId.source._elementRef.nativeElement.id;
    if (value === -1) {
      value = +eventOrId.value;
    }

    this.workersService.updateResourceWorker(id, value);
  }

  pathAvailable(id): boolean {
    return this.getResource(id).pathAvailable;
  }

  getResource(id): Resource {
    return this.resourcesService.getResource(id);
  }
}
