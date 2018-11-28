import { ResourceEnum } from '../resourceData';
import { GameService } from './../../game/game.service';
import { Entity } from './entity';

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

  public constructor(x: number, y: number, animationSpeed, path: Phaser.Curves.Path,
      animationType: ResourceAnimationType, resourceEnum: ResourceEnum, multiplier: number,
      spawnedByPlayer: boolean, scene: Phaser.Scene, texture: string, frame: string | number,
      game: GameService) {
    super(x, y, -1, animationSpeed, scene, texture, frame, game, path);

    this.animationType = animationType;

    this.resourceEnum = resourceEnum;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;

    this.startFollow((path.curves.length - 1) * 1000 / this.animationSpeed);
  }

  finishAnimation() {
    this.game.resources.getResource(this.resourceEnum).finishResourceAnimation(this.multiplier, this.animationType);

    this.destroy();
  }

  get pathingDone(): boolean {
    return this.pathTween.progress >= 1;
  }
}
