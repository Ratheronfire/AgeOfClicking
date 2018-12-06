import { BuildingNode } from '../../tile/buildingNode';
import { BuildingTileType } from '../../tile/tile';
import { UnitData } from '../actor';
import { EntityState } from '../entity';
import { GameService } from './../../../game/game.service';
import { Unit, UnitStat, UnitStats } from './unit';

export class BuilderStats extends UnitStats {
  owner: Builder;

  public getStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.RepairRate: {
        return `Repair Rate: ${Math.floor(this.getStat(stat))} Points/Tick`;
      } default: {
        return super.getStatString(stat);
      }
    }
  }

  public getUpgradedStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.RepairRate: {
        return `Repair Rate: ${Math.floor(this.getUpgradedStat(stat))} Points/Tick`;
      } default: {
        return super.getUpgradedStatString(stat);
      }
    }
  }

  public getStat(stat: UnitStat): number {
    switch (stat) {
      case UnitStat.RepairRate: {
        return this.owner.repairAmount;
      } default: {
        return super.getStat(stat);
      }
    }
  }

  public getUpgradedStat(stat: UnitStat): number {
    switch (stat) {
      case UnitStat.RepairRate: {
        return this.owner.repairAmount * 1.2;
      } default: {
        return super.getUpgradedStat(stat);
      }
    }
  }

  public upgradeStat(stat: UnitStat, upgradeForFree = false) {
    if (!this.canUpgradeStat(stat) && !upgradeForFree) {
      return;
    }

    switch (stat) {
      case UnitStat.RepairRate: {
        this.owner.repairAmount = this.getUpgradedStat(stat);
        break;
      }
    }

    super.upgradeStat(stat, upgradeForFree);
  }
}

export class Builder extends Unit {
  repairAmount = 5;

  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.stats = new BuilderStats(unitData.stats, this, this.game);
    this.currentState = EntityState.MovingToTarget;
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case EntityState.Repairing: {
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
      } case EntityState.MovingToTarget: {
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
      this.currentState = EntityState.MovingToTarget;
    } else if (buildingNode.health < buildingNode.maxHealth) {
      this.currentState = EntityState.Repairing;
    } else {
      this.pickTarget();
    }

    super.finishTask();
  }

  isPathBroken(): boolean {
    return !this.selectedTarget || !this.selectedTarget.properties['buildingNode'] || super.isPathBroken();
  }

  protected currentTileIsValid(): boolean {
    return this.currentTile && (this.game.map.isTileWalkable(this.currentTile) ||
      (this.currentTile.properties['buildingNode'] && this.currentTile.properties['buildingNode'].tileType === BuildingTileType.Wall));
  }
}
