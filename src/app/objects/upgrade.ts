import { ResourceType } from './resource';

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
  resourceId?: number;

  upgradeVariable: UpgradeVariable;
  upgradeFactor: number;
}

export interface ResourceCost {
  resourceId: number;
  resourceCost: number;
}

export class Upgrade {
  id: number;
  upgradeType: UpgradeType;

  name: string;
  description: string;

  upgradeEffects: UpgradeEffect[];

  resourceCosts: ResourceCost[];
  purchased: boolean;
}
