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

  baseFoodCost = 1;
  foodCostFactor = 0.6;

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
        if (!this.currentResourceNode || this.needToRestock()) {
          this.finishTask();
          break;
        }

        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          const harvestYield = this.currentResource.harvestYield;

          for (const resourceConsume of this.currentResource.resourceConsumes) {
            this.removeFromInventory(resourceConsume.resourceEnum, resourceConsume.cost * harvestYield);
          }

          this.addToInventory(this.currentResource.resourceEnum, harvestYield);

          let foodCost = this.baseFoodCost * (this.currentResource.resourceTier + 1) * this.foodCostFactor;
          if (this.currentResource.resourceType === ResourceType.Food) {
            // Food workers eat half as much to ensure they produce more than they consume.
            foodCost /= 2;
          }

          this.eatFood(foodCost);
        }

        break;
      }
    }
  }

  updateSprite(xDist: number, yDist: number) {
    if (this.currentState === EntityState.Harvesting) {
      xDist = this.currentResourceNode.owningTile.pixelX - this.currentTile.pixelX;
      yDist = this.currentResourceNode.owningTile.pixelY - this.currentTile.pixelY;

      this.setFlipX(xDist < 0 && yDist === 0);

      if (xDist > 0 && yDist === 0) {
        this.anims.play(this.texture.key + 'ActionRight', true);
      } else if (xDist < 0 && yDist === 0) {
        this.anims.play(this.texture.key + 'ActionRight', true);
      } else if (xDist === 0 && yDist > 0) {
        this.anims.play(this.texture.key + 'ActionDown', true);
      } else if (xDist === 0 && yDist < 0) {
        this.anims.play(this.texture.key + 'ActionUp', true);
      } else {
        this.anims.stop();
      }
    } else {
      super.updateSprite(xDist, yDist);
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
    if (this.currentResourceNode && !this.needToRestock()) {
      this.currentState = EntityState.Harvesting;
    }

    super.finishTask();
  }

  needToRestock() {
    if (!this.currentResource ||
      (this.currentResourceNode && !this.currentResourceNode.resourceEnums.includes(this.currentResource.resourceEnum))) {
      return true;
    }

    if (this.currentResource.resourceConsumes.length) {
      // We need to check if the inventory is full and if we have any resources that'll be freed up.
      // We don't need to check the inventory size since we'll be removing at least one item to make this resource.
      return this.currentResource.resourceConsumes.some(consume =>
        this.amountHeld(consume.resourceEnum) < consume.cost * this.currentResource.harvestYield);
    }

    return this.totalHeld + this.currentResource.harvestYield > this.resourceCapacity;
  }

  restock() {
    super.restock();

    this.currentResourceNode = null;

    this.baseActionInterval = this.currentResource.harvestMilliseconds;

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

        this.takeResourceFromBase(resourceConsume.resourceEnum, amountNeeded);
      }
    }

    this.currentState = EntityState.MovingToTarget;
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
}
