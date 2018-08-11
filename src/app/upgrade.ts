import { Tooltip } from './tooltip';

export enum UpgradeType {
  Resource,
  Worker
}

export enum UpgradeVariable {
  Harvestability,
  HarvestYield,
  HarvestMilliseconds,
  Workable,
  WorkerYield,
  WorkerCost
}

export interface UpgradeEffect {
  upgradeTargetId: number;
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