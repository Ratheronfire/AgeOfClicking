import { Injectable } from '@angular/core';

import { ResourceType } from '../../objects/resource';
import { ResourcesService } from '../resources/resources.service';
import { Worker, ResourceWorker } from '../../objects/worker';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseWorkers = require('../../../assets/json/workers.json');

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  public workers: Worker[] = baseWorkers;

  constructor(protected resourcesService: ResourcesService,
              protected messagesService: MessagesService) { }

  public getWorkers() {
    return this.workers;
  }

  public getWorker(idOrResourceType: number | string | ResourceType) {
    return typeof idOrResourceType === 'number' ?
      this.workers[idOrResourceType] :
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

  canAfford(id: number): boolean {
    const worker = this.getWorker(id);

    return worker.cost <= this.resourcesService.getResource(0).amount;
  }

  getResourceTooltipMessage(resourceId: number): string {
    const resource = this.resourcesService.getResource(resourceId);

    return `${resource.workerVerb} ${resource.workerYield} ${resource.workerNoun}${resource.workerYield === 1 ? '' : 's'} per second.`;
  }

  processWorkers() {
    for (const worker of this.workers) {
      for (const resourceWorker of worker.workersByResource) {
        if (resourceWorker.workerCount === 0) {
          continue;
        }

        this.resourcesService.addResourceAmount(resourceWorker.resourceId, resourceWorker.workerYield * resourceWorker.workerCount);
      }
    }
  }

  hireWorker(id: number) {
    if (!this.canAfford(id)) {
      return;
    }

    const worker = this.getWorker(id);

    this.resourcesService.addResourceAmount(0, -worker.cost);

    worker.cost *= 1.01;
    worker.workerCount++;
    worker.freeWorkers++;
  }

  private log(message: string) {
    this.messagesService.add(`WorkersService: ${message}`);
  }
}
