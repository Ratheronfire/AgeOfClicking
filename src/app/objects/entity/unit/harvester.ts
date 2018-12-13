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

    this.resourceCapacity = 20;

    this.findTargets();
    this.pickTarget();
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case EntityState.Harvesting: {
        if (!this.currentResourceNode || !this.canHarvest()) {
          this.finishTask();
          break;
        }

        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          for (const resourceConsume of this.currentResource.resourceConsumes) {
            this.addToInventory(resourceConsume.resourceEnum, -resourceConsume.cost);
          }

          this.addToInventory(this.currentResource.resourceEnum, 1);
        }

        break;
      }
    }
  }

  findTargets() {
    this.targets = [];

    if (!this.canHarvest()) {
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

    if (this.currentResourceNode && this.canHarvest()) {
      this.currentState = EntityState.Harvesting;
    } else if (buildingNode && buildingNode.tileType === BuildingTileType.Home) {
      this.currentResourceNode = null;

      // Empty all currently held items back into the base.
      for (const slot of this.inventory.filter(_slot => _slot.amount > 0)) {
        this.game.resources.getResource(slot.resourceEnum).addAmount(slot.amount);
        this.addToInventory(slot.resourceEnum, -slot.amount);
      }

      this.actionInterval = this.currentResource.harvestMilliseconds;

      if (this.currentResource.resourceConsumes.length) {
        // The number of storage units needed for each harvest, including its consumes and the resource itself.
        const spaceNeededPerHarvest = this.currentResource.resourceConsumes.map(consume => consume.cost)
          .reduce((total, cost) => total += cost) + 1;
        // The total number of harvests possible, based on the storage needed for it and its consumes.
        const resourceStorageLimit = Math.floor(this.resourceCapacity / spaceNeededPerHarvest);
        // The max number of harvests of harvests possible, based on available resource counts.
        const maximumAvailable = Math.max(...this.currentResource.resourceConsumes
          .map(consume => Math.min(consume.cost * resourceStorageLimit, this.game.resources.getResource(consume.resourceEnum).amount)));
        // The final number of harvests we're going to perform this run.
        const amountToHarvest = Math.min(resourceStorageLimit, maximumAvailable);

        for (const resourceConsume of this.currentResource.resourceConsumes) {
          let amountNeeded = resourceConsume.cost * amountToHarvest - this.amountHeld(resourceConsume.resourceEnum);
          if (amountNeeded < 0) {
            amountNeeded = 0;
          }

          const resource = this.game.resources.getResource(resourceConsume.resourceEnum);

          resource.addAmount(-amountNeeded);
          this.addToInventory(resourceConsume.resourceEnum, amountNeeded);
        }
      }

      this.currentState = EntityState.MovingToTarget;
    } else {
      this.pickTarget();
    }

    super.finishTask();
  }

  setResource(newResource: Resource) {
    this.currentResource = newResource;

    this.finishTask();
  }

  canHarvest(): boolean {
    if (!this.currentResource ||
      (this.currentResourceNode && !this.currentResourceNode.resourceEnums.includes(this.currentResource.resourceEnum))) {
      return false;
    }

    const hasEnoughConsumes = !this.currentResource.resourceConsumes.length ||
      this.currentResource.resourceConsumes.every(consume => this.amountHeld(consume.resourceEnum) >= consume.cost);

    return hasEnoughConsumes && this.totalHeld < this.resourceCapacity;
  }
}
