import { GameService } from './../game/game.service';
import { ResourceAnimationType } from './entity/resourceAnimation';
import { ResourceEnum, ResourceType } from './resourceData';

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

  edible = false;
  foodMultiplier = 1;

  resourceDescription: string;
  workerVerb: string;
  workerNoun: string;

  resourceTier: number;

  bindIndex: number;

  private game: GameService;

  public constructor(name: string, resourceType: ResourceType, resourceEnum: ResourceEnum, iconPath: string,
                     resourceConsumes: ResourceConsume[], harvestable: boolean, harvestYield: number = 1, harvestMilliseconds: number,
                     sellable: boolean, sellsFor: number, resourceDescription: string, workerVerb: string, workerNoun: string,
                     resourceTier: number, edible: boolean, foodMultiplier: number, game: GameService) {
    this.name = name;
    this.resourceType = resourceType;
    this.resourceEnum = resourceEnum;

    this.iconPath = iconPath;

    this.resourceConsumes = resourceConsumes;

    this.harvestable = harvestable;
    this.harvestYield = harvestYield;
    this.harvestMilliseconds = harvestMilliseconds;
    this.pathAvailable = false;

    this.sellable = sellable;
    this.sellsFor = sellsFor;

    this.resourceDescription = resourceDescription;
    this.workerVerb = workerVerb;
    this.workerNoun = workerNoun;

    this.resourceTier = resourceTier;

    this.edible = edible;
    this.foodMultiplier = foodMultiplier;

    this.game = game;
  }

  addAmount(amount: number) {
    this.amount += amount;
    if (this.amount <= 0) {
      this.amount = 0;
    }
  }

  harvestResource(multiplier = 1) {
    this.game.resources.updateHighestTier(this.resourceTier);

    this.addAmount(multiplier);
  }

  public deductResourceConsumes(multiplier = 1) {
    for (const resourceConsume of this.resourceConsumes) {
      this.game.resources.getResource(resourceConsume.resourceEnum).addAmount(-resourceConsume.cost * multiplier);
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
        this.game.resources.getResource(ResourceEnum.Gold).addAmount(multiplier * this.sellsFor);
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
      if (this.game.resources.getResource(resourceConsume.resourceEnum).amount < resourceConsume.cost * multiplier) {
        return false;
      }
    }

    return true;
  }

  get resourceAccessible(): boolean {
    return this.resourceTier <= this.game.resources.highestTierReached + 1;
  }
}
