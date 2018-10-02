import { Resource } from './resource';
import { Tick } from './../services/tick/tick.service';
import { WorkersService } from './../services/workers/workers.service';
import { ResourcesService } from './../services/resources/resources.service';
import { MapService } from './../services/map/map.service';
import { MessagesService } from './../services/messages/messages.service';
import { ResourceType, ResourceEnum } from './resourceData';
import { MessageSource } from './message';

export interface ResourceWorker {
  resourceEnum: ResourceEnum;
  workable: boolean;

  recurringCost: number;
  workerCount: number;
  workerYield: number;

  lastHarvestTime: number;

  sliderSetting: number;
  sliderSettingValid: boolean;
}

export class Worker implements Tick {
  cost: number;

  resourceType: ResourceType;
  workerCount = 0;
  freeWorkers = 0;

  resourceWorkers: Map<string, ResourceWorker>;

  minimumInterval = 1000;

  priorityOrder = 0;

  workersService: WorkersService;
  resourcesService: ResourcesService;
  mapService: MapService;
  messagesService: MessagesService;

  public constructor(cost: number, resourceType: ResourceType, resourceWorkers: Map<string, ResourceWorker>,
                     priorityOrder = 0, workersService: WorkersService, resourcesService: ResourcesService,
                     mapService: MapService, messagesService: MessagesService) {
    this.cost = cost;
    this.resourceType = resourceType;
    this.resourceWorkers = resourceWorkers;

    this.priorityOrder = priorityOrder;

    this.workersService = workersService;
    this.resourcesService = resourcesService;
    this.mapService = mapService;
    this.messagesService = messagesService;
  }

  public tick(elapsed: number, deltaTime: number) {
    for (const resourceWorker of this.getResourceWorkers()) {
      const resource = this.resourcesService.resources.get(resourceWorker.resourceEnum);

      if (resourceWorker.workerCount === 0 || elapsed - resourceWorker.lastHarvestTime < this.getWorkInterval(resource) ||
          !this.canAffordToHarvest(resource.resourceEnum)) {
        continue;
      }

      let workerOutput = resourceWorker.workerYield * resourceWorker.workerCount;
      if (resource.harvestMilliseconds < this.minimumInterval) {
        workerOutput *= this.minimumInterval / resource.harvestMilliseconds;
      }

      const amountToConsume = resourceWorker.recurringCost * resourceWorker.workerCount;
      this.workersService.foodStockpile -= amountToConsume;
      if (this.workersService.foodStockpile < 0) {
        const foodConsumed = amountToConsume + this.workersService.foodStockpile;
        workerOutput *= (foodConsumed / amountToConsume);
        this.workersService.foodStockpile = 0;
      }

      if (!this.canAffordToHarvest(resource.resourceEnum)) {
        this.log(`No more food available for ${resource.name}.`);
      }

      this.mapService.spawnHarvestedResourceAnimation(resource, workerOutput, false);

      resourceWorker.lastHarvestTime = elapsed;
    }
  }

  public getResourceWorkers(filterByAccessible = false, filterByWorkable = false, filterByHarvestable = false): ResourceWorker[] {
    let resourceWorkers = Array.from(this.resourceWorkers.values());

    if (filterByAccessible) {
      resourceWorkers = resourceWorkers.filter(rw => this.resourcesService.resources.get(rw.resourceEnum).resourceAccessible);
    }
    if (filterByWorkable) {
      resourceWorkers = resourceWorkers.filter(rw => rw.workable);
    }
    if (filterByHarvestable) {
      resourceWorkers = resourceWorkers.filter(rw => this.resourcesService.resources.get(rw.resourceEnum).harvestable);
    }

    return resourceWorkers;
  }

  hireWorker() {
    if (!this.canAffordToHire()) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-this.cost);

    this.cost *= 1.01;
    this.workerCount++;
    this.freeWorkers++;
  }

  canAffordToHire(): boolean {
    return this.cost <= this.resourcesService.resources.get(ResourceEnum.Gold).amount;
  }

  canAffordToHarvest(resourceEnum: ResourceEnum): boolean {
    return this.resourceWorkers.get(resourceEnum).recurringCost <= this.workersService.foodStockpile;
  }

  updateResourceWorker(resourceEnum: ResourceEnum, newResourceWorkerCount: number) {
    const resourceWorker = this.resourceWorkers.get(resourceEnum);

    if (!resourceWorker.sliderSettingValid) {
      newResourceWorkerCount = this.freeWorkers + resourceWorker.workerCount;
      resourceWorker.sliderSetting = newResourceWorkerCount;
    }

    const newFreeWorkers = this.freeWorkers + resourceWorker.workerCount - newResourceWorkerCount;

    this.freeWorkers = newFreeWorkers;
    resourceWorker.workerCount = newResourceWorkerCount;
  }

  getWorkInterval(resource: Resource): number {
    return Math.max(resource.harvestMilliseconds, this.minimumInterval);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Workers, message);
  }
}
