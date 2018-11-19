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
  workersPaused: boolean;

  foodStockpile = 0;
  foodCollectAmount = 1000;
  foodCollectInterval = 100;
  lastFoodCollectTime = Date.now();

  constructor(protected resourcesService: ResourcesService,
              protected mapService: MapService,
              protected messagesService: MessagesService) {
    this.loadBaseWorkers();
  }

  public loadBaseWorkers() {
    this.workers.clear();
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

        const workerYield = baseWorker.resourceWorkers[resoruceEnum].workerYield ? baseWorker.resourceWorkers[resoruceEnum].workerYield : 1;

        const resourceWorker: ResourceWorker = {
          resourceEnum: baseWorker.resourceWorkers[resoruceEnum].resourceEnum,
          workable: baseWorker.resourceWorkers[resoruceEnum].workable,
          recurringCost: baseWorker.resourceWorkers[resoruceEnum].recurringCost,
          workerCount: 0,
          workerYield: workerYield,
          lastHarvestTime: 0,
          sliderSetting: 0,
          sliderSettingValid: true
        };

        resourceWorkers.set(resoruceEnum, resourceWorker);
      }

      const worker = new Worker(baseWorker.cost, baseWorker.resourceType, resourceWorkers, baseWorker.priorityOrder,
                                this, this.resourcesService, this.mapService, this.messagesService);
      this.workers.set(resourceType, worker);
    }
  }

  tick(elapsed: number, deltaTime: number) {
    if (elapsed - this.lastFoodCollectTime > this.foodCollectInterval) {
      const foodAmount = Math.min(this.foodCollectAmount, this.foodCapacity - this.foodStockpile);
      this.foodStockpile += this.resourcesService.takeFood(foodAmount);

      this.lastFoodCollectTime = elapsed;
    }

    if (this.workersPaused) {
      return;
    }

    for (const worker of this.getWorkers(false, false, false, true)) {
      worker.tick(elapsed, deltaTime);
    }
  }

  public getWorkers(filterByAccessible = false, filterByWorkable = false, filterByHarvestable = false, orderByPriority = false): Worker[] {
    let workers = Array.from(this.workers.values());

    if (orderByPriority) {
      workers = workers.sort((a, b) => a.priorityOrder - b.priorityOrder);
    }

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

  public get foodCapacity(): number {
    return (this.resourcesService.highestTierReached + 1) * 10000;
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Workers, message);
  }
}
