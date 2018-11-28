import { ResourceEnum } from '../resourceData';
import { ResourceCost } from '../resourceCost';

export enum MapTileType {
  Grass = 'GRASS',
  Water = 'WATER',
  Mountain = 'MOUNTAIN'
}

export enum ResourceTileType {
  OakTree = 'OAKTREE',
  PineTree = 'PINETREE',
  BirchTree = 'BIRCHTREE',
  EucalyptusTree = 'EUCALYPTUSTREE',
  WillowTree = 'WILLOWTREE',
  TeakTree = 'TEAKTREE',
  DeadEnt = 'DEADENT',
  StoneMine = 'STONEMINE',
  GraphiteMine = 'GRAPHITEMINE',
  LimestoneMine = 'LIMESTONEMINE',
  MarbleMine = 'MARBLEMINE',
  QuartzMine = 'QUARTZMINE',
  ObsidianMine = 'OBSIDIANMINE',
  DiamondMine = 'DIAMONDMINE',
  CopperMine = 'COPPERMINE',
  TinMine = 'TINMINE',
  IronMine = 'IRONMINE',
  GoldMine = 'GOLDMINE',
  LatinumMine = 'LATINUMMINE',
  UnbelieviumMine = 'UNBELIEVIUMMINE',
  LustrialMine = 'LUSTRIALMINE',
  SpectrusMine = 'SPECTRUSMINE',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY',
  WheatFarm = 'WHEATFARM',
  RawPotatoFarm = 'RAWPOTATOFARM',
  RiceFarm = 'RICEFARM',
  FishingSpot = 'FISHINGSPOT',
  OakOven = 'OAKOVEN',
  StoneOven = 'STONEOVEN',
  MarbleOven = 'MARBLEOVEN',
  TemprousOven = 'TEMPROUSOVEN',
  ChickenFarm = 'CHICKENFARM',
  CowFarm = 'COWFARM',
  DragonFarm = 'DRAGONFARM'
}

export enum BuildingTileType {
  Wall = 'WALL',
  Road = 'ROAD',
  Home = 'HOME',
  Bridge = 'BRIDGE',
  Tunnel = 'TUNNEL',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY',
  OakOven = 'OAKOVEN',
  StoneOven = 'STONEOVEN',
  MarbleOven = 'MARBLEOVEN',
  TemprousOven = 'TEMPROUSOVEN',
  ChickenFarm = 'CHICKENFARM',
  CowFarm = 'COWFARM',
  DragonFarm = 'DRAGONFARM',
  WoodMarket = 'WOODMARKET',
  MineralMarket = 'MINERALMARKET',
  MetalMarket = 'METALMARKET'
}

export enum BuildingSubType {
  /** A building which creates a resource-spawning node. */
  Resource = 'RESOURCE',
  /** A building which automatically sells stored resources. */
  Market = 'MARKET',
  /** A building that resources and entities can travel on. */
  Path = 'PATH',
  /** A building that blocks entity travelling. */
  Obstacle = 'OBSTACLE',
  Miscellaneous = 'MISC'
}

export enum TileStat {
  SellRate = 'SELLRATE',
  SellAmount = 'SELLAMOUNT',
  MaxHealth = 'MAXHEALTH'
}

export interface MapTileData {
  tileType: MapTileType;

  name: string;

  walkable: boolean;
}

export interface BuildingTileData {
  tileType: BuildingTileType;
  subType: BuildingSubType;

  name: string;
  description: string;
  placeable: boolean;
  maxPlaceable: number;

  upgradeBuilding?: BuildingTileType;

  baseHealth: number;
  repairResourceEnum?: ResourceEnum;
  repairCostPerPoint?: number;

  resourceCosts: ResourceCost[];
  buildableSurfaces: MapTileType[];

  placesResourceTile: boolean;
  resourceTileType?: ResourceTileType;

  resourcePathable: boolean;
}

export interface ResourceTileData {
  tileType: ResourceTileType;

  name: string;
  placeable: boolean;

  spawnsOn: MapTileType[];
  isNaturalResource: boolean;
  spawnRate: number;

  resourceEnums: ResourceEnum[];
}
