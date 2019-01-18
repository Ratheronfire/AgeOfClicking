import { GameService } from './../game/game.service';
import { MessageSource } from './message';
import { ResourceCost } from './resourceCost';
import { ResourceEnum, ResourceType } from './resourceData';

export enum UpgradeType {
  Resource = 'RESOURCE',
  Worker = 'WORKER'
}

export enum UpgradeVariable {
  Harvestability = 'HARVESTABILITY',
  HarvestYield = 'HARVEST_YIELD',
  HarvestMilliseconds = 'HARVEST_MILLISECONDS',
  Workable = 'WORKABLE',
  WorkerYield = 'WORKER_YIELD',
  WorkerCost = 'WORKER_COST'
}

export interface UpgradeEffect {
  upgradeIsForWholeType: boolean;

  resourceType?: ResourceType;
  resourceEnum?: ResourceEnum;
  maxTier?: number;

  upgradeVariable: UpgradeVariable;
  upgradeFactor: number;
}

export class Upgrade {
  static UpgradeVariableNames = {
    'HARVESTABILITY': 'Harvestability',
    'HARVEST_YIELD': 'Harvest Yield',
    'HARVEST_MILLISECONDS': 'Harvest Time',
    'WORKABLE': 'Workability',
    'WORKER_YIELD': 'Worker Yield',
    'WORKER_COST': 'Worker Cost',
    'Harvestability': 'Harvestability',
    'HarvestYield': 'Harvest Yield',
    'HarvestMilliseconds': 'Harvest Time',
    'Workable': 'Workability',
    'WorkerYield': 'Worker Yield',
    'WorkerCost': 'Worker Cost'
  };

  id: number;

  name: string;
  description: string;
  flavorText: string;

  upgradeType: UpgradeType;

  upgradeEffects: UpgradeEffect[];
  resourceCosts: ResourceCost[];

  purchased = false;

  private game: GameService;

  public constructor(id: number, name: string, description: string, flavorText: string, upgradeType: UpgradeType,
                     upgradeEffects: UpgradeEffect[], resourceCosts: ResourceCost[], purchased = false,
                     game: GameService) {
    this.id = id;

    this.name = name;
    this.description = description;
    this.flavorText = flavorText;

    this.upgradeType = upgradeType;

    this.upgradeEffects = upgradeEffects;
    this.resourceCosts = resourceCosts;

    this.purchased = purchased;

    this.game = game;
  }

  public purchaseUpgrade() {
    if (this.purchased || !this.canAfford()) {
      return;
    }

    for (const resourceCost of this.resourceCosts) {
      this.game.resources.getResource(resourceCost.resourceEnum).addAmount(-resourceCost.resourceCost);
    }

    this.applyUpgrade();

    this.purchased = true;
  }

  public applyUpgrade(applySilently = false) {
    for (const upgradeEffect of this.upgradeEffects) {
      let resourcesToUpgrade = [];
      let workersToUpgrade = [];

      if (upgradeEffect.upgradeIsForWholeType) {
        resourcesToUpgrade = this.game.resources.getResources(upgradeEffect.resourceType);

        if (upgradeEffect.maxTier >= 0) {
          resourcesToUpgrade = resourcesToUpgrade.filter(resource => resource.resourceTier <= upgradeEffect.maxTier);
          workersToUpgrade = workersToUpgrade.filter(worker =>
            this.game.resources.getResource(worker.resourceEnum).resourceTier <= upgradeEffect.maxTier);
        }
      } else {
        resourcesToUpgrade.push(this.game.resources.getResource(upgradeEffect.resourceEnum));
      }

      for (const resourceToUpgrade of resourcesToUpgrade) {
        switch (upgradeEffect.upgradeVariable) {
          case UpgradeVariable.Harvestability: {
            resourceToUpgrade.harvestable = !!upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.HarvestYield: {
            resourceToUpgrade.harvestYield *= upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.HarvestMilliseconds: {
            resourceToUpgrade.harvestMilliseconds *= upgradeEffect.upgradeFactor;
            break;
          }
          default: {
            break;
          }
        }
      }

      for (const workerToUpgrade of workersToUpgrade) {
        switch (upgradeEffect.upgradeVariable) {
          case UpgradeVariable.Workable: {
            workerToUpgrade.workable = !!upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.WorkerYield: {
            workerToUpgrade.workerYield *= upgradeEffect.upgradeFactor;
            break;
          }
          default: {
            break;
          }
        }
      }
    }

    if (!applySilently) {
      this.log('Purchased upgrade: ' + this.name);
    }
  }

  public canAfford(): boolean {
    return this.resourceCosts.every(resourceCost =>
      this.game.resources.getResource(resourceCost.resourceEnum).amount >= resourceCost.resourceCost);
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Upgrades, message);
  }
}
