import { ResourceTileType } from './tile';
import { ResourceEnum } from '../resourceData';

export class ResourceNode {
  tileType: ResourceTileType;
  path?: Phaser.Tilemaps.Tile[];
  resourceEnums: ResourceEnum[];

  health: number;

  constructor(tileType: ResourceTileType, resourceEnums: ResourceEnum[], health: number) {
    this.tileType = tileType;
    this.path = [];
    this.resourceEnums = resourceEnums;

    this.health = health;
  }

  get travelMilliseconds(): number {
    return this.path ? (this.path.length - 1) * 1000 : Infinity;
  }
}
