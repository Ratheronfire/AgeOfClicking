import { ResourceEnum } from '../resourceData';
import { GameService } from './../../game/game.service';
import { Entity, EntityState } from './entity';

export enum ResourceAnimationType {
  PlayerSpawned = 'PLAYERSPAWNED',
  WorkerSpawned = 'WORKERSPAWNED',
  Sold = 'SOLD'
}

export class ResourceAnimation extends Entity {
  animationType: ResourceAnimationType;

  resourceEnum: ResourceEnum;
  multiplier: number;

  spawnedByPlayer: boolean;

  public constructor(x: number, y: number, animationSpeed,
      animationType: ResourceAnimationType, resourceEnum: ResourceEnum, multiplier: number,
      spawnedByPlayer: boolean, tilePath: Phaser.Tilemaps.Tile[], scene: Phaser.Scene, texture: string, frame: string | number,
      game: GameService) {
    super(x, y, -1, animationSpeed, scene, texture, frame, game);

    this.animationType = animationType;

    this.resourceEnum = resourceEnum;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;

    this.terrainTypeControlsSpeed = true;

    this.beginPathing(tilePath);
  }

  finishTask() {
    this.game.resources.getResource(this.resourceEnum).finishResourceAnimation(this.multiplier, this.animationType);

    this.destroy();
  }
}
