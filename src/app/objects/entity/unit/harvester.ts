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
            this.removeFromInventory(resourceConsume.resourceEnum, resourceConsume.cost);
          }

          this.addToInventory(this.currentResource.resourceEnum, 1);
        }

        break;
      }
    }
  }

  findTargets() {
    this.targets = [];

    if (!this.currentResource) {
      return;
    }

    let resourceTiles = this.game.map.getResourceTiles(this.currentResource.resourceEnum);
    resourceTiles = resourceTiles.filter(node => node.properties['resourceNode'].path && node.properties['resourceNode'].path.length > 0);
    resourceTiles = resourceTiles.sort((a, b) =>
      this.game.pathfinding.getPathWeight(a.properties['resourceNode'].path) -
      this.game.pathfinding.getPathWeight(b.properties['resourceNode'].path));

    if (resourceTiles.length) {
      this.targets.push(resourceTiles[0]);
      this.currentResourceNode = resourceTiles[0].properties['resourceNode'];
    }
  }

  finishTask() {
    const buildingNode: BuildingNode = this.currentTile ? this.currentTile.properties['buildingNode'] : null;

    if (buildingNode && buildingNode.tileType === BuildingTileType.Home) {
      this.currentResourceNode = null;

      this.returnAllResources();

      this.actionInterval = this.currentResource.harvestMilliseconds;

      if (this.currentResource.resourceConsumes.length) {
        // The number of storage units needed for each harvest, including its consumes and the resource itself.
        const spaceNeededPerHarvest = this.currentResource.resourceConsumes.map(consume => consume.cost)
          .reduce((total, cost) => total += cost);
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

          this.takeResource(resourceConsume.resourceEnum, amountNeeded);
        }
      }

      this.currentState = EntityState.MovingToTarget;
    } else if (this.currentResourceNode && this.canHarvest()) {
      this.currentState = EntityState.Harvesting;
    } else if (!this.canHarvest()) {
      this.currentState = EntityState.Restocking;
    } else {
      this.pickTarget();
    }

    super.finishTask();
  }

  sortedTargets(): Phaser.Tilemaps.Tile[] {
    // We're just going to move to a neighbor of the resource instead of the tile itself.
    const targetNeighbors = this.targets.map(tile => {
      const walkableNeighbors = this.game.map.getNeighborTiles(tile).filter(
        _tile => this.game.map.isTileWalkable(_tile));

      const pathNeighbors = walkableNeighbors.filter(_tile => _tile.properties['buildingNode'] &&
        [BuildingTileType.Road, BuildingTileType.Tunnel, BuildingTileType.Bridge].includes(_tile.properties['buildingNode'].tileType));

      if (pathNeighbors.length) {
        return pathNeighbors[Math.floor(Math.random() * pathNeighbors.length)];
      }

      return walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
    });

    return targetNeighbors.sort((a, b) => {
      const enemyPosition = new Phaser.Math.Vector2(this.x, this.y);
      const aPos = new Phaser.Math.Vector2(a.pixelX, a.pixelY);
      const bPos = new Phaser.Math.Vector2(b.pixelX, b.pixelY);

      return Math.abs(aPos.distance(enemyPosition)) - Math.abs(bPos.distance(enemyPosition));
    });
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

    if (this.currentResource.resourceConsumes.length) {
      // We need to check if the inventory is full and if we have any resources that'll be freed up.
      // We don't need to check the inventory size since we'll be removing at least one item to make this resource.
      return this.currentResource.resourceConsumes.every(consume => this.amountHeld(consume.resourceEnum) >= consume.cost);
    }

    return this.totalHeld < this.resourceCapacity;
  }
}