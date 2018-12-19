import { BuildingTileType } from '../../tile/tile';
import { UnitData } from '../actor';
import { EntityState } from '../entity';
import { GameService } from './../../../game/game.service';
import { BuildingNode } from './../../tile/buildingNode';
import { BuildingTileData } from './../../tile/tile';
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
  resourceCapacity = 100;

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
        const buildingNode: BuildingNode = this.currentTile.properties['buildingNode'];

        if (!buildingNode || !this.canBuild(this.currentTile)) {
          this.finishTask();
          break;
        }

        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          for (const slot of this.inventory.filter(_slot => _slot.resourceEnum !== null)) {
            const amountToSpend = Math.min(buildingNode.getRemainingResourceCost(slot.resourceEnum), this.repairAmount);

            buildingNode.addResource(slot.resourceEnum, amountToSpend);
            this.removeFromInventory(slot.resourceEnum, amountToSpend);

            if (amountToSpend > 0) {
              break;
            }
          }
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
    this.findTargets();

    if (!this.nextTarget || !this.nextTarget.properties['buildingNode']) {
      this.currentState = this.totalHeld > 0 ? EntityState.Restocking : EntityState.Sleeping;
    }

    if (buildingNode && buildingNode.tileType === BuildingTileType.Home) {
      this.returnAllResources();

      if (this.nextTarget) {
        const nextNode: BuildingNode = this.nextTarget.properties['buildingNode'];

        if (nextNode.resourcesNeeded.length) {
          const spacePerResource = Math.floor(this.resourceCapacity / nextNode.resourcesNeeded.length);
          const amountToBuild = this.amountOfBuildingTypeQueued(nextNode.tileType);

          for (const resourceEnum of nextNode.resourcesNeeded) {
            const resource = this.game.resources.getResource(resourceEnum);
            const costPerBuilding = nextNode.getResourceCost(resourceEnum);

            let amountToTake = Math.min(spacePerResource, amountToBuild * costPerBuilding);
            amountToTake = Math.min(amountToTake, resource.amount);

            this.takeResource(resourceEnum, amountToTake);
          }
        }

        this.currentState = EntityState.MovingToTarget;
      }
    } else if (!this.canBuild(this.nextTarget)) {
      this.currentState = EntityState.Restocking;
    } else if (this.currentBuildingNode.health < this.currentBuildingNode.maxHealth) {
      this.currentState = EntityState.Repairing;
    } else {
      this.currentState = EntityState.MovingToTarget;
    }

    super.finishTask();
  }

  getAdjustedSpeed(): number {
    let tileWeight = (this.terrainTypeControlsSpeed ? this.game.pathfinding.getTileWeight(this.currentTile) : 1);
    if (tileWeight === Infinity && this.currentTile.properties['buildingNode'] &&
        this.currentTile.properties['buildingNode'].health === 0) {
      // The builder is on an unbuilt tile over unwalkable ground, so we'll force it to be walkable for now.
      tileWeight = 5;
    }

    return this.animationSpeed * this.animationSpeedFactor / tileWeight;
  }

  isPathBroken(): boolean {
    return !this.selectedTarget || !this.selectedTarget.properties['buildingNode'] || super.isPathBroken();
  }

  protected currentTileIsValid(): boolean {
    return this.currentTile && (this.game.map.isTileWalkable(this.currentTile) ||
      (this.currentTile.properties['buildingNode'] && this.currentTile.properties['buildingNode'].tileType === BuildingTileType.Wall));
  }

  get currentBuildingData(): BuildingTileData {
    if (!this.currentBuildingNode) {
      return null;
    }

    return this.currentBuildingNode.tileData;
  }

  canBuild(tile: Phaser.Tilemaps.Tile): boolean {
    if (!tile || !this.selectedTarget || !this.selectedTarget.properties['buildingNode']) {
      return false;
    }

    const buildingNode: BuildingNode = tile.properties['buildingNode'];

    return buildingNode.health < buildingNode.maxHealth && buildingNode.resourcesNeeded.some(cost => this.amountHeld(cost) > 0);
  }

  amountOfBuildingTypeQueued(buildingType: BuildingTileType): number {
    const buildings: BuildingNode[] = this.targets.map(target => target.properties['buildingNode']);

    return buildings.filter(building => building && building.tileType === buildingType && building.health < building.maxHealth).length;
  }

  get nextTarget(): Phaser.Tilemaps.Tile {
    const sortedTargets = this.sortedTargets().filter(
      tile => tile.properties['buildingNode'].health < tile.properties['buildingNode'].maxHealth);

    return sortedTargets.length ? sortedTargets[0] : null;
  }
}
