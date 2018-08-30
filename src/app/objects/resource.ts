export enum ResourceType {
  Currency = 'CURRENCY',
  Wood = 'WOOD',
  Mineral = 'MINERAL',
  Metal = 'METAL'
}

export interface ResourceConsume {
  resourceId: number;
  cost: number;
}

export interface Worker {
  workable: boolean;
  workerCount: number;
  cost: number;
}

export class Resource {
  id: number;
  name: string;
  resourceType: ResourceType;
  iconPath: string;

  amount: number;
  amountTravelling = 0;

  resourceConsumes: ResourceConsume[];

  harvestable: boolean;
  harvestYield?: number;
  harvestMilliseconds?: number;

  harvestStartDate = Date.now();
  harvesting = false;
  progressBarValue = 0;

  workerYield?: number;

  sellable: boolean;
  sellsFor?: number;

  resourceDescription: string;
  workerVerb: string;
  workerNoun: string;

  resourceAccessible: boolean;
  resourceTier: number;
  previousTier: number;

  worker: Worker;
}
