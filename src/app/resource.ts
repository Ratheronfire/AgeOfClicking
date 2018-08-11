export class Resource {
  id: number;
  name: string;
  
  value: number;
  
  harvestable: boolean;
  harvestYield?: number;
  harvestMilliseconds?: number;
  
  workerYield?: number;
  
  sellable: boolean;
  sellsFor?: number;
}