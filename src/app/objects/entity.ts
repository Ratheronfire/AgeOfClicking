import { BuildingTileType, Tile } from './tile';

export class Entity {
  name: string;

  x: number;
  y: number;
  currentTile: Tile;

  tilePath: Tile[];
  pathStep: number;

  pathingDone = false;

  health: number;
  maxHealth: number;
}

export class Enemy extends Entity {
  targetableBuildingTypes: BuildingTileType[];
  targets: Tile[];
  targetIndex: number;

  attack: number;
  defense: number;

  resourcesToSteal: number[];
  resourcesHeld: number[];
  totalHeld: number;
  stealMax: number;
  resourceCapacity: number;
}

export class ResourceAnimation extends Entity {
  resourceId: number;
  multiplier: number;

  spawnedByPlayer: boolean;
}
