import { Injectable } from '@angular/core';

import { ResourceType, ResourceEnum } from './../../objects/resourceData';
import { MessageSource } from '../../objects/message';
import { ResourcesService } from '../resources/resources.service';
import { Worker, ResourceWorker } from '../../objects/worker';
import { MapService } from './../map/map.service';
import { MessagesService } from '../messages/messages.service';
import { Tick } from './../tick/tick.service';

declare var require: any;
const baseWorkers = require('../../../assets/json/workers.json');

@Injectable({
  providedIn: 'root'
})
export class WorkersService implements Tick {
  public workers = new Map<string, Worker>();
  workersPaused = false;

  workerDelay = 1000;
  lastWorkerTime: number;

  constructor(protected resourcesService: ResourcesService,
              protected mapService: MapService,
              protected messagesService: MessagesService) {
    this.loadBaseWorkers();
  }

  public loadBaseWorkers() {
    for (const resourceTypeString in ResourceType) {
      if (Number(resourceTypeString)) {
        continue;
      }

      const resourceType = ResourceType[resourceTypeString];

      const baseWorker = baseWorkers[resourceType];
      if (!baseWorker) {
        continue;
      }

      const resourceWorkers = new Map<string, ResourceWorker>();
      for (const resoruceEnum in baseWorker.resourceWorkers) {
        if (Number(resoruceEnum)) {
          continue;
        }

        resourceWorkers.set(resoruceEnum, baseWorker.resourceWorkers[resoruceEnum]);
      }

      const worker = new Worker(baseWorker.cost, baseWorker.resourceType, resourceWorkers,
                                this.resourcesService, this.mapService, this.messagesService);
      this.workers.set(resourceType, worker);
    }
  }

  tick(elapsed: number, deltaTime: number) {
    if (this.workersPaused || elapsed - this.lastWorkerTime < this.workerDelay) {
      return;
    }

    this.lastWorkerTime = elapsed;

    for (const worker of this.getWorkers()) {
      worker.tick(elapsed, deltaTime);
    }
  }

  public getWorkers(filterByAccessible = false, filterByWorkable = false, filterByHarvestable = false): Worker[] {
    const workers = Array.from(this.workers.values());
    return workers.filter(worker => worker.getResourceWorkers(filterByAccessible, filterByWorkable, filterByHarvestable).length);
  }

  public getWorker(resourceEnum: ResourceEnum): Worker {
    const resoruce = this.resourcesService.resources.get(resourceEnum);
    return this.workers.get(resoruce.resourceType);
  }

  public getResourceWorker(resourceEnum: ResourceEnum): ResourceWorker {
    const resource = this.resourcesService.resources.get(resourceEnum);
    const worker = this.workers.get(resource.resourceType);

    if (!resource || !worker) {
      return undefined;
    }

    return worker.resourceWorkers.get(resourceEnum);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Workers, message);
  }
}
