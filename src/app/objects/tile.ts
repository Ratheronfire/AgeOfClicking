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
  TemprousDistillery = 'TEMPROUSDISTILLERY'
}

export enum BuildingTileType {
  Wall = 'WALL',
  Road = 'ROAD',
  Home = 'HOME',
  Bridge = 'BRIDGE',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY'
}

export interface ResourceCost {
  resourceId: number;
  resourceCost: number;
}

export interface MapTile {
  tileType: MapTileType;

  name: string;

  walkable: boolean;
}

export interface BuildingTile {
  tileType: BuildingTileType;

  name: string;
  description: string;
  placeable: boolean;

  resourceCosts: ResourceCost[];
  buildableSurfaces: MapTileType[];

  placesResourceTile: boolean;
  resourceTileType?: ResourceTileType;

  resourcePathable: boolean;
}

export interface ResourceTile {
  tileType: ResourceTileType;

  name: string;
  placeable: boolean;

  resourceIds: number[];
}

export interface TileImage {
  name: string;

  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileCropDetail {
  x: number;
  y: number;

  width: number;
  height: number;
}

export class Tile {
  id: number;

  mapTileType: MapTileType;
  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingPath?: Tile[];
  buildingRemovable: boolean;

  x: number;
  y: number;

  tileCropDetail: TileCropDetail;
}
