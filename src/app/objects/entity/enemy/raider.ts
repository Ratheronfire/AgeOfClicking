import { ResourceEnum } from '../../resourceData';
import { BuildingNode } from '../../tile/buildingNode';
import { BuildingTileType } from '../../tile/tile';
import { EnemyData } from '../actor';
import { EntityState } from '../entity';
import { GameService } from './../../../game/game.service';
import { Enemy } from './enemy';

export class Raider extends Enemy {
  resourcesToSteal: ResourceEnum[];

  minimumResourceAmount = 500;
  stealMax: number;
  resourceCapacity: number;

  public constructor(x: number, y: number, enemyData: EnemyData, difficultyMultiplier: number,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super (x, y, enemyData, difficultyMultiplier, scene, texture, frame, game);

    this.resourcesToSteal = enemyData.resourcesToSteal;
    this.resourcesHeld = new Map<ResourceEnum, number>();
    this.totalHeld = 0;
    this.stealMax = enemyData.stealMax * difficultyMultiplier;
    this.resourceCapacity = enemyData.resourceCapacity * difficultyMultiplier;
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    if (this.currentState === EntityState.Looting) {
      if (elapsed - this.lastActionTime > this.actionInterval) {
        this.lastActionTime = elapsed;

        if (!this.canSteal()) {
          this.finishTask();

          return;
        }

        const resourceIndex = Math.floor(Math.random() * this.resourcesToSteal.length);
        const resourceToSteal = this.game.resources.getResource(this.resourcesToSteal[resourceIndex]);

        if (resourceToSteal.amount > this.minimumResourceAmount) {
          let amountToSteal = Math.floor(Math.random() * this.stealMax);
          if (resourceToSteal.amount - amountToSteal < this.minimumResourceAmount) {
            amountToSteal = resourceToSteal.amount - this.minimumResourceAmount;
          }

          if (!this.resourcesHeld.get(resourceToSteal.resourceEnum)) {
            this.resourcesHeld.set(resourceToSteal.resourceEnum, amountToSteal);
          } else {
            this.resourcesHeld.set(resourceToSteal.resourceEnum, this.resourcesHeld.get(resourceToSteal.resourceEnum) + amountToSteal);
          }

          if (amountToSteal > 0) {
            this.totalHeld += amountToSteal;

            resourceToSteal.addAmount(-amountToSteal);
            this.log(`An enemy stole ${Math.floor(amountToSteal)} ${resourceToSteal.name}!`);
          }
        }
      }
    }
  }

  finishTask() {
    const buildingNode: BuildingNode = this.currentTile ? this.currentTile.properties['buildingNode'] : null;

    if (buildingNode && buildingNode.tileType === BuildingTileType.Home) {
      this.currentState = this.currentState === EntityState.Looting ? EntityState.MovingToTarget : EntityState.Looting;
    }

    super.finishTask();
  }

  canSteal(): boolean {
    return this.totalHeld < this.resourceCapacity &&
      this.resourcesToSteal.some(resource =>
      this.game.resources.getResource(resource).amount > this.minimumResourceAmount);
  }

  destroy() {
    let enemyDefeatedMessage = 'An enemy has been defeated!';

    if (this.totalHeld > 0) {
      enemyDefeatedMessage += ' Resources recovered:';

      for (const resourceEnum of this.resourcesToSteal) {
        const stolenAmount = this.resourcesHeld.get(resourceEnum);
        if (isNaN(stolenAmount) || stolenAmount <= 0) {
          continue;
        }

        const resource = this.game.resources.getResource(resourceEnum);
        resource.addAmount(stolenAmount);

        enemyDefeatedMessage += ` ${Math.floor(stolenAmount)} ${resource.name},`;
      }

      enemyDefeatedMessage = enemyDefeatedMessage.slice(0, enemyDefeatedMessage.length - 1) + '.';
    }

    this.log(enemyDefeatedMessage);

    super.destroy();
  }
}
