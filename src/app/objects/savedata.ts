import { MessageSource } from '../objects/message';
import { EnemyType } from './entity/enemy/enemy';
import { UnitType } from './entity/unit/unit';
import { ResourceEnum, ResourceType } from './resourceData';
import { BuildingTileType, ResourceTileType } from './tile';

export interface ResourceSaveData {
  resourceEnum: ResourceEnum;
  amount: number;
  autoSellCutoff: number;
}

export interface WorkerSaveData {
  resourceType: ResourceType;
  cost: number;
  workerCount: number;
  workersByResource: ResourceWorkerSaveData[];
}

export interface ResourceWorkerSaveData {
  resourceEnum: ResourceEnum;
  workable: boolean;
  workerCount: number;
}

export interface TileSaveData {
  id: number;

  health: number;
  maxHealth: number;

  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingRemovable: boolean;

  statLevels: {};
  statCosts: {};

  sellInterval?: number;
  sellQuantity?: number;
}

export interface EnemySaveData {
  enemyType: EnemyType;

  x: number;
  y: number;

  health: number;
  maxHealth: number;

  animationSpeed: number;

  attack: number;
  defense: number;
  attackRange: number;

  targetableBuildingTypes: BuildingTileType[];
  resourcesToSteal: ResourceEnum[];
  resorucesHeld: Map<ResourceEnum, number>;
  stealMax: number;
  resourceCapacity: number;
}

export interface UnitSaveData {
  unitType: UnitType;

  x: number;
  y: number;

  health: number;
  maxHealth: number;

  animationSpeed: number;

  attack: number;
  defense: number;
  attackRange: number;

  cost: number;

  movable: boolean;

  fireMilliseconds: number;

  statLevels: {};
  statCosts: {};
}

export interface SettingsSaveData {
  autosaveInterval: number;
  debugMode: boolean;

  highestTierReached: number;

  workersPaused: boolean;
  hidePurchasedUpgrades: boolean;

  resourceBinds: ResourceEnum[];
  visibleSources: MessageSource[];

  enemiesActive: boolean;

  slimInterface: boolean;
  organizeLeftPanelByType: boolean;

  mapLowFramerate: boolean;

  harvestDetailColor?: string;
  workerDetailColor?: string;
  resourceAnimationColors;

  prngSeed: number;
}

export class SaveData {
  resources: ResourceSaveData[];
  purchasedUpgrades: number[];
  workers: WorkerSaveData[];
  tiles: TileSaveData[];
  enemies: EnemySaveData[];
  units: UnitSaveData[];

  settings: SettingsSaveData;

  foodStockpile: number;
  gameVersion: string;
}
