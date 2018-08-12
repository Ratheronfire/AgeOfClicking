export enum ResourceType {
  Currency,
  Wood,
  Metal
}

export interface ResourceConsume {
  resourceId: number;
  cost: number;
}

export class Resource {
  id: number;
  name: string;
  resourceType: ResourceType;
  
  amount: number;

  resourceConsumes: ResourceConsume[];
  
  harvestable: boolean;
  harvestYield?: number;
  harvestMilliseconds?: number;
  
  workerYield?: number;
  
  sellable: boolean;
  sellsFor?: number;
}