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

  spritePath: string;

  walkable: boolean;
}

export interface BuildingTile {
  tileType: BuildingTileType;

  spritePath: string;

  name: string;
  description: string;

  resourceCosts: ResourceCost[];
  buildableSurfaces: MapTileType[];
}

export class Tile {
  mapTileType: MapTileType;
  buildingTileType?: BuildingTileType;
}
