import { GameService } from './../game/game.service';
import { MessageSource } from './message';
import { Resource } from './resource';
import { ResourceEnum, ResourceType } from './resourceData';

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

export class Worker {
  cost: number;

  resourceType: ResourceType;
  workerCount = 0;
  freeWorkers = 0;

  resourceWorkers: Map<string, ResourceWorker>;

  minimumInterval = 1000;

  priorityOrder = 0;

  private game: GameService;

  public constructor(cost: number, resourceType: ResourceType, resourceWorkers: Map<string, ResourceWorker>,
                     priorityOrder = 0, game: GameService) {
    this.cost = cost;
    this.resourceType = resourceType;
    this.resourceWorkers = resourceWorkers;

    this.priorityOrder = priorityOrder;

    this.game = game;
  }

  public tick(elapsed: number, deltaTime: number) {
    for (const resourceWorker of this.getResourceWorkers()) {
      const resource = this.game.resources.getResource(resourceWorker.resourceEnum);

      if (resourceWorker.workerCount === 0 || elapsed - resourceWorker.lastHarvestTime < this.getWorkInterval(resource) ||
          !this.canAffordToHarvest(resource.resourceEnum)) {
        continue;
      }

      let workerOutput = resourceWorker.workerYield * resourceWorker.workerCount;
      if (resource.harvestMilliseconds < this.minimumInterval) {
        workerOutput *= this.minimumInterval / resource.harvestMilliseconds;
      }

      const amountToConsume = resourceWorker.recurringCost * resourceWorker.workerCount;
      this.game.workers.foodStockpile -= amountToConsume;
      if (this.game.workers.foodStockpile < 0) {
        const foodConsumed = amountToConsume + this.game.workers.foodStockpile;
        workerOutput *= (foodConsumed / amountToConsume);
        this.game.workers.foodStockpile = 0;
      }

      if (!this.canAffordToHarvest(resource.resourceEnum)) {
        this.log(`No more food available for ${resource.name}.`);
      }

      this.game.map.spawnHarvestedResourceAnimation(resource, workerOutput, false);

      resourceWorker.lastHarvestTime = elapsed;
    }
  }

  public getResourceWorkers(filterByAccessible = false, filterByWorkable = false, filterByHarvestable = false): ResourceWorker[] {
    let resourceWorkers = Array.from(this.resourceWorkers.values());

    if (filterByAccessible) {
      resourceWorkers = resourceWorkers.filter(rw => this.game.resources.getResource(rw.resourceEnum).resourceAccessible);
    }
    if (filterByWorkable) {
      resourceWorkers = resourceWorkers.filter(rw => rw.workable);
    }
    if (filterByHarvestable) {
      resourceWorkers = resourceWorkers.filter(rw => this.game.resources.getResource(rw.resourceEnum).harvestable);
    }

    return resourceWorkers;
  }

  hireWorker() {
    if (!this.canAffordToHire()) {
      return;
    }

    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-this.cost);

    this.cost *= 1.01;
    this.workerCount++;
    this.freeWorkers++;
  }

  canAffordToHire(): boolean {
    return this.cost <= this.game.resources.getResource(ResourceEnum.Gold).amount;
  }

  canAffordToHarvest(resourceEnum: ResourceEnum): boolean {
    return this.resourceWorkers.get(resourceEnum).recurringCost <= this.game.workers.foodStockpile;
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
    this.game.messages.add(MessageSource.Workers, message);
  }
}
