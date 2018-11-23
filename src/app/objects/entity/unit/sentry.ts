import { Unit } from './unit';
import { UnitData, ActorState } from '../actor';
import { ResourcesService } from 'src/app/services/resources/resources.service';
import { EnemyService } from 'src/app/services/enemy/enemy.service';
import { MapService } from 'src/app/services/map/map.service';

export class Sentry extends Unit {
  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number,
      resourcesService: ResourcesService, enemyService: EnemyService, mapService: MapService) {
    super(x, y, unitData, scene, texture, frame, resourcesService, enemyService, mapService);

    this.currentState = ActorState.Stationary;
  }

  tick (elapsed: number, deltaTime: number) {
    if (elapsed - this.lastFire > this.fireMilliseconds) {
      const enemiesInRange = this.enemyService.enemies.filter(
        enemy => Math.abs(Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2)) / 48 <= this.attackRange);

      const targetedEnemy = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];

      if (targetedEnemy) {
        this.mapService.spawnProjectile(this, targetedEnemy);
      }

      this.lastFire = elapsed;
    }
  }

  findTargets() {
    return;
  }

  pickTarget() {
    return;
  }

  finishTask() {
    return;
  }
}
