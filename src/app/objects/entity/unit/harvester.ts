import { Resource } from '../../resource';
import { ResourceType, ResourceEnum } from '../../resourceData';
import { BuildingNode } from '../../tile/buildingNode';
import { ResourceNode } from '../../tile/resourceNode';
import { BuildingTileType } from '../../tile/tile';
import { EntityState } from '../entity';
import { GameService } from './../../../game/game.service';
import { MapTileType } from './../../tile/tile';
import { UnitData } from './../actor';
import { Unit } from './unit';

export class Harvester extends Unit {
  resourceType: ResourceType;
  currentResource: Resource;

  currentResourceNode: ResourceNode;

  public constructor(x: number, y: number, unitData: UnitData, resourceType: ResourceType,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.resourceType = resourceType;
    this.currentResource = this.game.resources.getResources(resourceType)[0];

    this.resourceCapacity = 10;

    this.findTargets();
    this.pickTarget();
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case EntityState.Harvesting: {
        if (!this.currentResourceNode || !this.currentResource.canAfford(1)) {
          this.finishTask();
          break;
        }

        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          this.addToInventory(this.currentResource.resourceEnum, 1);
        }

        if (this.totalHeld >= this.resourceCapacity) {
          this.finishTask();
        }

        break;
      }
    }
  }

  findTargets() {
    this.targets = [];

    if (!this.currentResource || this.totalHeld >= this.resourceCapacity) {
      this.targets = this.game.map.getBuildingTiles(BuildingTileType.Home);

      return;
    }

    let resourceTiles = this.game.map.getResourceTiles(this.currentResource.resourceEnum);
    resourceTiles = resourceTiles.filter(node => node.properties['resourceNode'].path && node.properties['resourceNode'].path.length > 0);
    resourceTiles = resourceTiles.sort((a, b) =>
      this.game.pathfinding.getPathWeight(a.properties['resourceNode'].path) -
      this.game.pathfinding.getPathWeight(b.properties['resourceNode'].path));

    if (resourceTiles.length) {
      this.targets.push(resourceTiles[0]);
    }
  }

  pickTarget() {
    if (this.islandId === undefined) {
      // The enemy's position has become invalid, so we'll just move it somewhere random.
      this.moveToNewTile();
    }

    this.findTargets();

    if (this.targets.length) {
      const sortedTargets = this.sortedTargets();
      this.selectedTarget = sortedTargets[0];

      this.currentResourceNode = this.selectedTarget.properties['resourceNode'];

      // We're just going to move to a neighbor of the resource instead of the tile itself.
      if (this.currentResourceNode) {
        const neighbors = this.game.map.getNeighborTiles(this.selectedTarget).filter(tile =>
          this.game.map.isTileWalkable(tile));
        this.selectedTarget = neighbors[Math.floor(Math.random() * neighbors.length)];
      }
    } else {
      this.currentState = EntityState.Sleeping;
      this.selectedTarget = null;
    }

    if (this.selectedTarget) {
      this.game.pathfinding.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  finishTask() {
    const buildingNode: BuildingNode = this.currentTile ? this.currentTile.properties['buildingNode'] : null;

    if (this.currentResourceNode && this.totalHeld < this.resourceCapacity) {
      this.currentState = EntityState.Harvesting;
    } else if (buildingNode && buildingNode.tileType === BuildingTileType.Home) {
      this.currentResourceNode = null;

      const amountHeld = this.amountHeld(this.currentResource.resourceEnum);

      this.currentResource.addAmount(amountHeld);
      this.addToInventory(this.currentResource.resourceEnum, -amountHeld);

      this.actionInterval = this.currentResource.harvestMilliseconds;

      this.currentState = EntityState.MovingToTarget;
    } else {
      this.pickTarget();
    }

    super.finishTask();
  }
}
