import { ActorState, UnitData } from '../actor';
import { GameService } from './../../../game/game.service';
import { Unit } from './unit';

export class Sentry extends Unit {
  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.currentState = ActorState.Stationary;
  }

  tick (elapsed: number, deltaTime: number) {
    if (elapsed - this.lastFire > this.fireMilliseconds) {
      const enemiesInRange = this.game.enemy.enemies.filter(
        enemy => Math.abs(Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2)) / 48 <= this.attackRange);

      const targetedEnemy = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];

      if (targetedEnemy) {
        this.game.map.spawnProjectile(this, targetedEnemy);
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
