export enum MapTileType {
  Grass = 'GRASS',
  Water = 'WATER',
  Mountain = 'MOUNTAIN'
}

export enum BuildingTileType {
  Wall = 'WALL'
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
  buildingTileType?: BuildingTileType;

  x: number;
  y: number;

  tileCropDetail: TileCropDetail;
}
