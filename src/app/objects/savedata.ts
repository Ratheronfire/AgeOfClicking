import { Vector } from './vector';
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

  health: number;
  maxHealth: number;

  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingRemovable: boolean;

  tileCropDetail: TileCropDetail;
}

export interface EnemyData {
  name: string;

  position: Vector;
  spawnPosition: Vector;

  health: number;
  maxHealth: number;

  animationSpeed: number;

  attack: number;
  defense: number;
  attackRange: number;

  targetableBuildingTypes: BuildingTileType[];
  resourcesToSteal: number[];
  resorucesHeld: number[];
  stealMax: number;
  resourceCapacity: number;
}

export interface FighterData {
  name: string;
  description: string;

  position: Vector;
  spawnPosition: Vector;

  health: number;
  maxHealth: number;

  animationSpeed: number;

  attack: number;
  defense: number;
  attackRange: number;

  cost: number;

  moveable: boolean;

  fireMilliseconds: number;
}

export interface SettingsData {
  autosaveInterval: number;
  debugMode: boolean;

  enemiesActive: boolean;

  slimInterface: boolean;

  mapLowFramerate: boolean;

  harvestDetailColor: string;
  workerDetailColor: string;
}

export class SaveData {
  resources: ResourceData[];
  upgrades: UpgradeData[];
  workers: WorkerData[];
  tiles: TileData[];
  enemies: EnemyData[];
  fighters: FighterData[];

  settings: SettingsData;

  gameVersion: string;
}
