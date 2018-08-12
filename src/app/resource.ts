export enum ResourceType {
  Currency = "CURRENCY",
  Wood = "WOOD",
  Metal = "METAL"
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