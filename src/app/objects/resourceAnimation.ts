import { Tile } from './tile';

export class ResourceAnimation {
  resourceId: number;
  multiplier: number;

  spawnedByPlayer: boolean;

  x: number;
  y: number;

  buildingPath: Tile[];
  pathStep: number;
  done = false;
}
