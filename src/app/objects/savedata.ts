import { ResourceType, ResourceEnum } from './resourceData';
import { Vector } from './vector';
import { MapTileType, ResourceTileType, BuildingTileType } from './tile';
import { MessageSource } from '../objects/message';

export interface ResourceData {
  resourceEnum: ResourceEnum;
  amount: number;
  autoSellCutoff: number;
}

export interface WorkerData {
  resourceType: ResourceType;
  cost: number;
  workerCount: number;
  workersByResource: ResourceWorkerData[];
}

export interface ResourceWorkerData {
  resourceEnum: ResourceEnum;
  workable: boolean;
  workerCount: number;
}

export interface TileData {
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

export interface EnemyData {
  name: string;

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

export interface FighterData {
  name: string;
  description: string;

  x: number;
  y: number;

  health: number;
  maxHealth: number;

  animationSpeed: number;

  attack: number;
  defense: number;
  attackRange: number;

  cost: number;

  moveable: boolean;

  fireMilliseconds: number;

  statLevels: {};
  statCosts: {};
}

export interface SettingsData {
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
  resources: ResourceData[];
  purchasedUpgrades: number[];
  workers: WorkerData[];
  tiles: TileData[];
  enemies: EnemyData[];
  fighters: FighterData[];

  settings: SettingsData;

  foodStockpile: number;
  gameVersion: string;
}
