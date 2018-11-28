import { BuildingNode } from '../../tile/buildingNode';
import { ActorState, UnitData } from '../actor';
import { GameService } from './../../../game/game.service';
import { Unit, UnitStat } from './unit';

export class Builder extends Unit {
  repairAmount = 5;

  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.currentState = ActorState.MovingToTarget;
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case ActorState.Repairing: {
        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          const buildingNode: BuildingNode = this.currentTile.properties['buildingNode'];

          if (!buildingNode) {
            this.finishTask();
            break;
          }

          if (this.game.map.canRepairBuilding(this.currentTile, this.repairAmount)) {
            this.game.map.repairBuilding(this.currentTile, this.repairAmount);
          }

          if (buildingNode.health >= buildingNode.maxHealth) {
            this.finishTask();
          }
        }

        break;
      } case ActorState.MovingToTarget: {
        if (this.isPathBroken()) {
          this.finishTask();
        }

        break;
      }
    }
  }

  findTargets() {
    this.targets = [];

    for (const tile of this.game.map.getBuildingTiles()) {
      const buildingNode: BuildingNode = tile.properties['buildingNode'];
      if (buildingNode.health < buildingNode.maxHealth) {
        this.targets.push(tile);
      }
    }
  }

  finishTask() {
    const buildingNode: BuildingNode = this.currentTile ? this.currentTile.properties['buildingNode'] : null;

    if (!buildingNode) {
      this.currentState = ActorState.MovingToTarget;
    } else if (buildingNode.health < buildingNode.maxHealth) {
      this.currentState = ActorState.Repairing;
    } else {
      this.pickTarget();
    }
  }

  public getStatString(stat: UnitStat): string {
    if (stat === UnitStat.RepairRate) {
      return 'Repair Rate: ' + Math.floor(this.getStat(stat)) + ' Points/Tick';
    }

    return super.getStatString(stat);
  }

  public getUpgradedStatString(stat: UnitStat): string {
    if (stat === UnitStat.RepairRate) {
      return 'Repair Rate: ' + Math.floor(this.getUpgradedStat(stat)) + ' Points/Tick';
    }

    return super.getUpgradedStatString(stat);
  }

  public getStat(stat: UnitStat): number {
    if (stat === UnitStat.RepairRate) {
      return this.repairAmount;
    }

    return super.getStat(stat);
  }

  public getUpgradedStat(stat: UnitStat): number {
    if (stat === UnitStat.RepairRate) {
      return this.repairAmount * 1.2;
    }

    return super.getUpgradedStat(stat);
  }

  public upgradeStat(stat: UnitStat) {
    if (this.canUpgradeStat(stat) && stat === UnitStat.RepairRate) {
      this.repairAmount = this.getUpgradedStat(stat);

      this.statLevels[stat]++;
      this.statCosts[stat] *= 1.5;
    } else {
      super.upgradeStat(stat);
    }
  }
}
