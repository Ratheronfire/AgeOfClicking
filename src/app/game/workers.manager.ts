import { MessageSource } from '../objects/message';
import { ResourceEnum, ResourceType } from '../objects/resourceData';
import { Worker, ResourceWorker } from '../objects/worker';
import { GameService } from './game.service';

declare var require: any;
const baseWorkers = require('../../assets/json/workers.json');

export class WorkersManager {
  public workers = new Map<string, Worker>();
  workersPaused: boolean;

  foodStockpile = 0;
  foodCollectAmount = 1000;
  foodCollectInterval = 100;
  lastFoodCollectTime = 0;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

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

      const worker = new Worker(baseWorker.cost, baseWorker.resourceType, resourceWorkers, baseWorker.priorityOrder, this.game);
      this.workers.set(resourceType, worker);
    }
  }

  tick(elapsed: number, deltaTime: number) {
    if (elapsed - this.lastFoodCollectTime > this.foodCollectInterval) {
      const foodAmount = Math.min(this.foodCollectAmount, this.foodCapacity - this.foodStockpile);
      this.foodStockpile += this.game.resources.takeFood(foodAmount);

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

  public getWorkerFromType(resourceType: ResourceType): Worker {
    return this.workers.get(resourceType);
  }

  public getWorkerFromResource(resourceEnum: ResourceEnum) {
    const resource = this.game.resources.getResource(resourceEnum);
    return this.getWorkerFromType(resource.resourceType);
  }

  public getResourceWorker(resourceEnum: ResourceEnum): ResourceWorker {
    const resource = this.game.resources.getResource(resourceEnum);
    const worker = this.workers.get(resource.resourceType);

    if (!resource || !worker) {
      return undefined;
    }

    return worker.resourceWorkers.get(resourceEnum);
  }

  public get foodCapacity(): number {
    return (this.game.resources.highestTierReached + 1) * 10000;
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Workers, message);
  }
}
