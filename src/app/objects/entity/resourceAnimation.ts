import { MapService } from 'src/app/services/map/map.service';
import { ResourcesService } from 'src/app/services/resources/resources.service';
import { StoreService } from 'src/app/services/store/store.service';
import { ResourceEnum } from '../resourceData';
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

  resourcesService: ResourcesService;
  storeService: StoreService;

  public constructor(x: number, y: number, animationSpeed, path: Phaser.Curves.Path,
      animationType: ResourceAnimationType, resourceEnum: ResourceEnum, multiplier: number,
      spawnedByPlayer: boolean, scene: Phaser.Scene, texture: string, frame: string | number,
      mapService: MapService, resourcesService: ResourcesService, storeService: StoreService) {
    super(x, y, -1, animationSpeed, scene, texture, frame, mapService, path);

    this.animationType = animationType;

    this.resourceEnum = resourceEnum;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;

    this.resourcesService = resourcesService;
    this.storeService = storeService;

    this.startFollow((path.curves.length - 1) * 1000 / this.animationSpeed);
  }

  finishAnimation() {
    this.resourcesService.resources.get(this.resourceEnum).finishResourceAnimation(this.multiplier, this.animationType);

    this.destroy();
  }

  get pathingDone(): boolean {
    return this.pathTween.progress >= 1;
  }
}
