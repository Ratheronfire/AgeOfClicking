import { Tile } from './tile';

export class ResourceAnimation {
  resourceId: number;

  x: number;
  y: number;

  sourceTile: Tile;
  currentTile: Tile;
  destinationTile: Tile;
  pathStep: number;
  done = false;
}
