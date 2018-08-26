import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
import { ResourcesService } from '../../services/resources/resources.service';
import { Worker } from '../../objects/worker';
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
    return this.workersService.canAfford(id);
  }

  getTooltipMessage(id: number): string {
    return this.tooltipService.getWorkerTooltip(id);
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

  updateResourceWorker(event: any) {
    this.workersService.updateResourceWorker(+event.source._elementRef.nativeElement.id, +event.value);
  }
}
