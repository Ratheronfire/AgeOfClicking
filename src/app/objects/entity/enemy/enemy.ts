import { GameService } from './../../../game/game.service';
import { EnemyData } from 'src/app/objects/entity/actor';
import { MessageSource } from '../../message';
import { MapTileType } from '../../tile/tile';
import { BuildingNode } from '../../tile/buildingNode';
import { Actor, ActorState } from '../actor';

export enum EnemyType {
  Raider = 'RAIDER'
}

export class Enemy extends Actor {
  enemyType: EnemyType;
  tilePath: Phaser.Tilemaps.Tile[] = [];

  public constructor(x: number, y: number, enemyData: EnemyData, difficultyMultiplier: number,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, enemyData.maxHealth * difficultyMultiplier,
      enemyData.movementSpeed * Math.min(4, 1 + difficultyMultiplier / 10000), enemyData.attack * difficultyMultiplier,
      enemyData.defense * difficultyMultiplier, enemyData.attackRange, scene, texture, frame, game);

    this.enemyType = enemyData.enemyType;

    this.targetableBuildingTypes = enemyData.targetableBuildingTypes;

    this.currentState = ActorState.MovingToTarget;

    this.currentTile = this.game.map.mapLayer.getTileAtWorldXY(this.x, this.y);
    this.lastIslandId = this.currentTile.properties['islandId'];

    this.findTargets();
    this.pickTarget();

    this.log('An enemy has appeared!');
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case ActorState.Destroying: {
        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          const buildingNode: BuildingNode = this.currentTile.properties['buildingNode'];

          if (!buildingNode) {
            this.finishTask();
            break;
          }

          buildingNode.takeDamage(this.attack);

          if (buildingNode.health <= 0) {
            this.game.map.updatePaths(this.currentTile, true);
            this.finishTask();
          }
        }

        break;
      } case ActorState.Wandering:
        case ActorState.MovingToTarget: {
        if (this.isPathBroken()) {
          this.finishTask();
        }

        break;
      }
    }
  }

  pickTarget() {
    if (!this.islandId) {
      // The enemy's position has become invalid, so we'll just move it somewhere random.
      this.moveToNewTile();
    }

    if (this.targets.length) {
      const sortedTargets = this.sortedTargets();
      this.selectedTarget = sortedTargets[0];
    } else {
      const shouldTargetBuilding = Math.random() < 0.15 && this.game.map.islandHasActiveTiles(this.islandId);

      let randomTarget;

      if (shouldTargetBuilding) {
        this.currentState = ActorState.MovingToTarget;
        randomTarget = this.game.map.getRandomTileOnIsland(this.islandId, [MapTileType.Grass], true, true);
      } else {
        this.currentState = ActorState.Wandering;
        randomTarget = this.game.map.getRandomTileOnIsland(this.islandId, [MapTileType.Grass, MapTileType.Water], true);
      }

      this.targets.push(randomTarget);
      this.selectedTarget = randomTarget;
    }

    if (!this.selectedTarget) {
      this.currentState = ActorState.Sleeping;
    } else {
      this.game.map.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  finishTask() {
    const buildingNode: BuildingNode = this.currentTile ? this.currentTile.properties['buildingNode'] : null;
    if (!buildingNode) {
      this.currentState = ActorState.MovingToTarget;
    } else {
      // this.currentState = this.currentState === ActorState.Destroying ? ActorState.MovingToTarget : ActorState.Destroying;
    }

    super.finishTask();
  }

  protected log(message: string) {
    this.game.messages.add(MessageSource.Enemy, message);
  }
}
