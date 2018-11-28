import { ResourceTileType } from './tile';

export class ResourceNode {
  tileType: ResourceTileType;
  path?: Phaser.Tilemaps.Tile[];
  health: number;

  constructor(tileType: ResourceTileType, health: number) {
    this.tileType = tileType;
    this.path = [];
    this.health = health;
  }

  get travelMilliseconds(): number {
    return this.path ? (this.path.length - 1) * 1000 : Infinity;
  }
}
