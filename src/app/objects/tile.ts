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
  DeadEnt = 'DEADENT'
}

export enum BuildingTileType {
  Wall = 'WALL',
  Road = 'ROAD',
  Home = 'HOME',
  Bridge = 'BRIDGE'
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

  resourceCosts: ResourceCost[];
  buildableSurfaces: MapTileType[];
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
  mapTileType: MapTileType;
  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingPath?: Tile[];
  resourceId?: number;

  x: number;
  y: number;

  tileCropDetail: TileCropDetail;
}
