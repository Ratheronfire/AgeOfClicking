import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';
import { Worker } from '../worker';
import { WorkersService } from './../workers.service';
import { AdminService } from './../admin.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  getWorkers(): Worker[] {
    return this.workersService.getWorkers();
  }

  public getWorker(idOrResourceType: number | ResourceType) {
    return this.workersService.getWorker(idOrResourceType);
  }

  canAfford(id: number): boolean {
    return this.workersService.canAfford(id);
  }

  getTooltipMessage(id: number): string {
    return this.workersService.getResourceTooltipMessage(id);
  }

  hireWorker(id: number) {
    this.workersService.hireWorker(id);
  }

  checkSliderValue(event: any) {
    const resource = this.resourcesService.getResource(+event.source._elementRef.nativeElement.id);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = worker.workersByResource.find(ws => ws.resourceId === resource.id);

    const newValue = +event.value;

    resourceWorker.sliderSettingValid = worker.freeWorkers + resourceWorker.workerCount - newValue >= 0;
  }

  updateResourceWorkers(event: any) {
    const resource = this.resourcesService.getResource(+event.source._elementRef.nativeElement.id);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = worker.workersByResource.find(ws => ws.resourceId === resource.id);

    if (!resourceWorker.sliderSettingValid) {
      return;
    }

    const newValue = +event.value;
    const newFreeWorkers = worker.freeWorkers + resourceWorker.workerCount - newValue;

    worker.freeWorkers = newFreeWorkers;
    resourceWorker.workerCount = newValue;
  }
}
