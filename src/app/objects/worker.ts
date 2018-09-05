import { ResourceType } from './resource';

export interface ResourceWorker {
  resourceId: number;
  workable: boolean;

  recurringCost: number;
  workerCount: number;
  workerYield: number;

  sliderSetting: number;
  sliderSettingValid: boolean;
}

export class Worker {
  id: number;

  cost: number;

  resourceType: ResourceType;
  workerCount: number;
  freeWorkers: number;

  workersByResource: ResourceWorker[];
}
