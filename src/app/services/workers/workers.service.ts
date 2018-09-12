import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { ResourceType } from '../../objects/resource';
import { MessageSource } from '../../objects/message';
import { ResourcesService } from '../resources/resources.service';
import { Worker, ResourceWorker } from '../../objects/worker';
import { MapService } from './../map/map.service';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseWorkers = require('../../../assets/json/workers.json');

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  public workers: Worker[] = baseWorkers;

  constructor(protected resourcesService: ResourcesService,
              protected mapService: MapService,
              protected messagesService: MessagesService) {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.processWorkers());
  }

  public getWorkers(filterByAccessible: boolean, filterByWorkable: boolean, filterByHarvestable: boolean) {
    let workers = this.workers;

    if (filterByAccessible) {
      workers = this.workers.filter(worker => worker.workersByResource.some(
        rw => this.resourcesService.getResource(rw.resourceId).resourceAccessible));
    }

    if (filterByWorkable) {
      workers = this.workers.filter(worker => worker.workersByResource.some(rw => rw.workable));
    }

    if (filterByHarvestable) {
      workers = this.workers.filter(worker => worker.workersByResource.some(
        rw => this.resourcesService.getResource(rw.resourceId).harvestable));
    }

    return workers;
  }

  public getWorker(idOrResourceType: number | string | ResourceType) {
    return typeof idOrResourceType === 'number' ?
      this.workers.find(worker => worker.id === idOrResourceType) :
      this.workers.find(worker => worker.resourceType === idOrResourceType);
  }

  public getResourceWorker(resourceId: number): ResourceWorker {
    const resourceType = this.resourcesService.getResource(resourceId).resourceType;
    const worker = this.getWorker(resourceType);

    if (worker === undefined) {
      return null;
    }

    return worker.workersByResource.find(rw => rw.resourceId === resourceId);
  }

  canAffordWorker(id: number): boolean {
    const worker = this.getWorker(id);

    return worker.cost <= this.resourcesService.getResource(0).amount;
  }

  canAffordToHarvest(resourceId: number): boolean {
    const resourceWorker = this.getResourceWorker(resourceId);

    return this.resourcesService.getResource(0).amount >= resourceWorker.recurringCost;
  }

  processWorkers() {
    for (const worker of this.workers) {
      for (const resourceWorker of worker.workersByResource) {
        if (resourceWorker.workerCount === 0 || !this.canAffordToHarvest(resourceWorker.resourceId)) {
          continue;
        }

        this.resourcesService.addResourceAmount(0, -resourceWorker.recurringCost * resourceWorker.workerCount);

        if (!this.canAffordToHarvest(resourceWorker.resourceId)) {
          this.log(`No more money available for ${this.resourcesService.getResource(resourceWorker.resourceId).name}.`);
        }

        this.mapService.spawnResourceAnimation(resourceWorker.resourceId, resourceWorker.workerYield * resourceWorker.workerCount, false);
      }
    }
  }

  updateResourceWorker(id: number, newResourceWorkerCount: number) {
    const resource = this.resourcesService.getResource(id);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = worker.workersByResource.find(ws => ws.resourceId === resource.id);

    if (!resourceWorker.sliderSettingValid) {
      newResourceWorkerCount = worker.freeWorkers + resourceWorker.workerCount;
      resourceWorker.sliderSetting = newResourceWorkerCount;
    }

    const newFreeWorkers = worker.freeWorkers + resourceWorker.workerCount - newResourceWorkerCount;

    worker.freeWorkers = newFreeWorkers;
    resourceWorker.workerCount = newResourceWorkerCount;
  }

  hireWorker(id: number) {
    if (!this.canAffordWorker(id)) {
      return;
    }

    const worker = this.getWorker(id);

    this.resourcesService.addResourceAmount(0, -worker.cost);

    worker.cost *= 1.01;
    worker.workerCount++;
    worker.freeWorkers++;
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Workers, message);
  }
}
