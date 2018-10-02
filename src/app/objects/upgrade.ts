import { ResourcesService } from './../services/resources/resources.service';
import { WorkersService } from './../services/workers/workers.service';
import { MessagesService } from './../services/messages/messages.service';
import { ResourceCost } from './resourceCost';
import { ResourceType, ResourceEnum } from './resourceData';
import { MessageSource } from './message';

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

  upgradeType: UpgradeType;

  upgradeEffects: UpgradeEffect[];
  resourceCosts: ResourceCost[];

  purchased = false;

  resourcesService: ResourcesService;
  workersService: WorkersService;
  messagesService: MessagesService;

  public constructor(id: number, name: string, description: string, upgradeType: UpgradeType,
                     upgradeEffects: UpgradeEffect[], resourceCosts: ResourceCost[], purchased = false,
                     resourcesService: ResourcesService, workersService: WorkersService, messagesService: MessagesService) {
    this.id = id;
    this.name = name;
    this.description = description;

    this.upgradeType = upgradeType;

    this.upgradeEffects = upgradeEffects;
    this.resourceCosts = resourceCosts;

    this.purchased = purchased;

    this.resourcesService = resourcesService;
    this.workersService = workersService;
    this.messagesService = messagesService;
  }

  public purchaseUpgrade() {
    if (this.purchased || !this.canAfford()) {
      return;
    }

    for (const resourceCost of this.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(-resourceCost.resourceCost);
    }

    this.applyUpgrade();

    this.purchased = true;
  }

  public applyUpgrade(applySilently = false) {
    for (const upgradeEffect of this.upgradeEffects) {
      if (upgradeEffect.upgradeVariable === UpgradeVariable.WorkerCost) {
        this.workersService.workers.get(upgradeEffect.resourceType).cost *= upgradeEffect.upgradeFactor;
        continue;
      }

      let resourcesToUpgrade = [];
      let workersToUpgrade = [];

      if (upgradeEffect.upgradeIsForWholeType) {
        resourcesToUpgrade = this.resourcesService.getResources(upgradeEffect.resourceType);
        workersToUpgrade = this.workersService.workers.get(upgradeEffect.resourceType).getResourceWorkers();

        if (upgradeEffect.maxTier >= 0) {
          resourcesToUpgrade = resourcesToUpgrade.filter(resource => resource.resourceTier <= upgradeEffect.maxTier);
          workersToUpgrade = workersToUpgrade.filter(worker =>
            this.resourcesService.resources.get(worker.resourceEnum).resourceTier <= upgradeEffect.maxTier);
        }
      } else {
        resourcesToUpgrade.push(this.resourcesService.resources.get(upgradeEffect.resourceEnum));
        workersToUpgrade.push(this.workersService.getResourceWorker(upgradeEffect.resourceEnum));
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
        switch(upgradeEffect.upgradeVariable) {
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
      this.resourcesService.resources.get(resourceCost.resourceEnum).amount >= resourceCost.resourceCost);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Workers, message);
  }
}
