import { Tile } from './tile';

export class ResourceAnimation {
  resourceId: number;

  x: number;
  y: number;

  buildingPath: Tile[];
  pathStep: number;
  done = false;
}
