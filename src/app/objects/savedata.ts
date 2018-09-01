import { MapTileType, ResourceTileType, BuildingTileType, Tile, TileCropDetail } from './tile';

export interface ResourceData {
  id: number;
  amount: number;
  harvestable: boolean;
  harvestYield: number;
  harvestMilliseconds: number;
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

export interface TileData {
  id: number;

  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingPath?: Tile[];
  buildingRemovable: boolean;

  tileCropDetail: TileCropDetail;
}

export interface SettingsData {
  autosaveInterval: number;
  debugMode: boolean;
}

export class SaveData {
  resources: ResourceData[];
  upgrades: UpgradeData[];
  workers: WorkerData[];
  tiles: TileData[];

  settings: SettingsData;

  gameVersion: string;
}
