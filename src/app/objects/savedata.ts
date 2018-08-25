export interface ResourceData {
  id: number;
  amount: number;
  harvestable: boolean;
  harvestYield: number;
  sellable: boolean;
  sellsFor: number;
  resourceAccessible: boolean;
}

export interface UpgradeData {
  id: number;
  purchased: boolean;
}

export interface WorkerData {
  id: number;
  cost: number;
  workerCount: number;
  workersByResource: ResourceWorkerData[];
}

export interface ResourceWorkerData {
  resourceId: number;
  workable: boolean;
  workerCount: number;
  workerYield: number;
}

export class SaveData {
  resources: ResourceData[];
  upgrades: UpgradeData[];
  workers: WorkerData[];
  autosaveInterval: number;
}
