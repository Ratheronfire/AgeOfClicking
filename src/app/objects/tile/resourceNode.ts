import { ResourceTileType } from './tile';
import { ResourceEnum } from '../resourceData';

export class ResourceNode {
  tileType: ResourceTileType;
  owningTile: Phaser.Tilemaps.Tile;

  path?: Phaser.Tilemaps.Tile[];
  resourceEnums: ResourceEnum[];

  health: number;

  constructor(tileType: ResourceTileType, owningTile: Phaser.Tilemaps.Tile, resourceEnums: ResourceEnum[], health: number) {
    this.tileType = tileType;
    this.owningTile = owningTile;

    this.path = [];
    this.resourceEnums = resourceEnums;

    this.health = health;
  }

  get travelMilliseconds(): number {
    return this.path ? (this.path.length - 1) * 1000 : Infinity;
  }
}
