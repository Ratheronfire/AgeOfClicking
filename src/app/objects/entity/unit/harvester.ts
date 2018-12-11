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
  desiredResources: Resource[];

  currentResourceIndex: number;
  currentResourceNode: ResourceNode;

  public constructor(x: number, y: number, unitData: UnitData, resourceType: ResourceType,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.resourceType = resourceType;
    this.desiredResources = this.game.resources.getResources(resourceType, null, false, false, true);

    this.totalHeld = 0;
    this.resourceCapacity = 10;
    this.currentResourceIndex = 0;

    this.resourcesHeld = new Map<ResourceEnum, number>();
    for (const desiredResource of this.desiredResources) {
      this.resourcesHeld.set(desiredResource.resourceEnum, 0);
    }

    this.findTargets();
    this.pickTarget();
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case EntityState.Harvesting: {
        if (!this.currentResourceNode) {
          this.finishTask();
          break;
        } else if (!this.currentResource.canAfford(1)) {
          // If there are other resources, we'll try to harvest one of those instead.
          // Otherwise, we'll wait until we can harvest again.
          if (this.desiredResources.length > 1) {
            this.finishTask();
          }

          break;
        }

        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          const newResourceCount = this.resourcesHeld.get(this.currentResource.resourceEnum) + 1;
          this.resourcesHeld.set(this.currentResource.resourceEnum, newResourceCount);
          this.totalHeld += 1;
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

    if (this.totalHeld >= this.resourceCapacity) {
      this.targets = this.game.map.getBuildingTiles(BuildingTileType.Home);

      return;
    } else if (!this.desiredResources) {
      return;
    }

    for (const resource of this.desiredResources) {
      let resourceTiles = this.game.map.getResourceTiles(resource.resourceEnum);
      resourceTiles = resourceTiles.filter(node => node.properties['resourceNode'].path && node.properties['resourceNode'].path.length > 0);
      resourceTiles = resourceTiles.sort((a, b) =>
        this.game.pathfinding.getPathWeight(a.properties['resourceNode'].path) -
        this.game.pathfinding.getPathWeight(b.properties['resourceNode'].path));

      if (resourceTiles.length) {
        this.targets.push(resourceTiles[0]);
      }
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
          tile.properties['tileType'] === MapTileType.Grass);
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

      for (const desiredResource of this.desiredResources) {
        desiredResource.addAmount(this.resourcesHeld.get(desiredResource.resourceEnum));
        this.resourcesHeld.set(desiredResource.resourceEnum, 0);
      }

      this.totalHeld = 0;

      this.currentResourceIndex = (this.currentResourceIndex + 1) % this.desiredResources.length;
      this.actionInterval = this.currentResource.harvestMilliseconds;

      this.currentState = EntityState.MovingToTarget;
    } else {
      this.pickTarget();
    }

    super.finishTask();
  }

  get currentResource(): Resource {
    return this.desiredResources[this.currentResourceIndex];
  }
}
