import { Injectable } from '@angular/core';

import { Worker } from './worker';
import { Resource, ResourceType } from './resource';
import { ResourcesService } from './resources.service';
import { MessagesService } from './messages.service';
import { Tooltip } from './tooltip';

import * as baseWorkers from 'src/assets/json/workers.json';

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  public workers: Worker[] = baseWorkers.default;

  constructor(private resourcesService: ResourcesService,
              private messagesService: MessagesService) { }

  public processWorkers() {
    for (const worker of this.workers) {
      if (worker.workerCount <= 0) {
        continue;
      }

      const resource = this.resourcesService.resources[worker.resourceId];

      resource.amount += resource.workerYield * worker.workerCount;
    }
  }

  public hireWorker(id: number) {
    if (!this.canAfford(id)) {
      return;
    }

    this.resourcesService.resources[0].amount -= this.workers[id].cost;
    this.workers[id].cost *= 1.01;
    this.workers[id].workerCount++;
  }

  public canAfford(id: number): boolean {
    return (this.resourcesService.resources[0].amount >= this.workers[id].cost);
  }

  public getTooltip(id: number): Tooltip {
    const workerYield = this.resourcesService.resources[id].workerYield;

    const workerTooltips: Tooltip[] = [
      { elementId: 0, tooltipMessage: '' },
      { elementId: 1, tooltipMessage: `Fells ${workerYield} tree${workerYield == 1 ? '' : 's'}  per second.` },
      { elementId: 2, tooltipMessage: `Mines ${workerYield} copper ore per second.` },
      { elementId: 3, tooltipMessage: `Mines ${workerYield} tin ore per second.` },
      { elementId: 4, tooltipMessage: `Forges ${workerYield} bronze ingots per second.` },
      { elementId: 5, tooltipMessage: `Mines ${workerYield} iron ore per second.` },
      { elementId: 6, tooltipMessage: `Forges ${workerYield} iron ingot${workerYield == 1 ? '' : 's'} per second.` },
    ];

    return workerTooltips[id];
  }

  public workersByType(resourceType: ResourceType, filterByWorkable: boolean): Worker[] {
    let workers = this.workers.filter(worker => this.resourcesService.resources[worker.resourceId].resourceType === resourceType);
    if (filterByWorkable) {
      workers = workers.filter(worker => worker.workable);
    }

    return workers;
  }

  public workerTooltip(id: number): string {
    const worker = this.workers[id];
    const resource = this.resourcesService.resources[worker.resourceId];

    return `${resource.workerVerb} ${resource.workerYield} ${resource.workerNoun}${resource.workerYield == 1? '' : 's'} per second.`;
  }

  public workables(): Worker[] {
    return this.workers.filter(worker => worker.workable);
  }

  private log(message: string) {
    this.messagesService.add(`WorkersService: ${message}`);
  }
}
