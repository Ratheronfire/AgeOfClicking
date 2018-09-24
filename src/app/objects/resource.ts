import { ResourceType, ResourceEnum } from './resourceData';
import { ResourceAnimationType } from './entity';
import { ResourcesService } from '../services/resources/resources.service';

export interface ResourceConsume {
  resourceEnum: ResourceEnum;
  cost: number;
}

export class Resource {
  name: string;
  resourceType: ResourceType;
  resourceEnum: ResourceEnum;

  iconPath: string;

  amount = 0;
  amountTravelling = 0;

  resourceConsumes: ResourceConsume[];

  harvestable = true;
  harvestYield = 1;
  harvestMilliseconds = 1000;
  pathAvailable: boolean;

  harvestStartDate = Date.now();
  harvesting = false;
  progressBarValue = 0;

  sellable = true;
  sellsFor = 0;
  autoSellCutoff = 0;

  resourceDescription: string;
  workerVerb: string;
  workerNoun: string;

  resourceTier: number;

  resourceBeingStolen = false;

  bindIndex: number;

  resourcesService: ResourcesService;

  public constructor(name: string, resourceType: ResourceType, resourceEnum: ResourceEnum, iconPath: string,
                     resourceConsumes: ResourceConsume[], harvestable: boolean, harvestMilliseconds: number, sellable: boolean,
                     sellsFor: number, resourceDescription: string, workerVerb: string, workerNoun: string, resourceTier: number,
                     resourcesService: ResourcesService) {
    this.name = name;
    this.resourceType = resourceType;
    this.resourceEnum = resourceEnum;

    this.iconPath = iconPath;

    this.resourceConsumes = resourceConsumes;

    this.harvestable = harvestable;
    this.harvestMilliseconds = harvestMilliseconds;
    this.pathAvailable = false;

    this.sellable = sellable;
    this.sellsFor = sellsFor;

    this.resourceDescription = resourceDescription;
    this.workerVerb = workerVerb;
    this.workerNoun = workerNoun;

    this.resourceTier = resourceTier;

    this.resourcesService = resourcesService;
  }

  addAmount(amount: number) {
    this.amount += amount;
    if (this.amount <= 0) {
      this.amount = 0;
    }
  }

  harvestResource(multiplier = 1) {
    if (this.resourceTier > this.resourcesService.highestTierReached) {
      this.resourcesService.highestTierReached = this.resourceTier;
    }

    this.addAmount(multiplier);
  }

  public deductResourceConsumes(multiplier = 1) {
    for (const resourceConsume of this.resourceConsumes) {
      this.resourcesService.resources.get(resourceConsume.resourceEnum).addAmount(-resourceConsume.cost * multiplier);
    }
  }

  public finishResourceAnimation(multiplier = 1, animationType: ResourceAnimationType) {
    switch (animationType) {
      case ResourceAnimationType.PlayerSpawned: {
        this.amountTravelling--;
        this.harvestResource(multiplier);
        break;
      } case ResourceAnimationType.WorkerSpawned: {
        this.harvestResource(multiplier);
        break;
      } case ResourceAnimationType.Sold: {
        this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(multiplier * this.sellsFor);
        break;
      }
    }
  }

  public canHarvest(multiplier = 1): boolean {
    if (!this.harvestable || !this.pathAvailable) {
      return false;
    }

    return this.canAfford(multiplier);
  }

  public canAfford(multiplier = 1): boolean {
    for (const resourceConsume of this.resourceConsumes) {
      if (this.resourcesService.resources.get(resourceConsume.resourceEnum).amount < resourceConsume.cost * multiplier) {
        return false;
      }
    }

    return true;
  }

  get resourceAccessible(): boolean {
    return this.resourceTier <= this.resourcesService.highestTierReached + 1;
  }
}
