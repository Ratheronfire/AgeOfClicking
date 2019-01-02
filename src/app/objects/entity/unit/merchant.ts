import { Unit } from './unit';
import { ResourceType, ResourceEnum } from '../../resourceData';
import { UnitData } from '../actor';
import { GameService } from 'src/app/game/game.service';
import { EntityState } from '../entity';
import { BuildingTileType, BuildingSubType } from '../../tile/tile';
import { Market } from '../../tile/market';

export class Merchant extends Unit {
  resourceType: ResourceType;

  resourceCapacity = 100;
  sellAmount = 10;

  baseFoodCost = 0.2;

  public constructor(x: number, y: number, unitData: UnitData, resourceType: ResourceType,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData, scene, texture, frame, game);

    this.resourceType = resourceType;

    this.findTargets();
    this.pickTarget();
  }

  tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

    switch (this.currentState) {
      case EntityState.Selling: {
        if (this.needToRestock()) {
          this.finishTask();
        } else if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          for (const slot of this.inventory.filter(_slot => _slot.resourceEnum !== null)) {
            const amountToSell = Math.min(slot.amount, this.sellAmount);
            const resource = this.game.resources.getResource(slot.resourceEnum);

            this.addToInventory(ResourceEnum.Gold, amountToSell * resource.sellsFor);
            this.removeFromInventory(slot.resourceEnum, amountToSell);

            this.eatFood(amountToSell * this.baseFoodCost);

            const marketNode = this.currentBuildingNode as Market;
            marketNode.logSale(amountToSell * resource.sellsFor);

            if (amountToSell > 0) {
              break;
            }
          }
        }

        break;
      }
    }
  }

  findTargets() {
    switch (this.resourceType) {
      case ResourceType.Wood: {
        this.targets = this.game.map.getBuildingTiles(BuildingTileType.WoodMarket);
        break;
      } case ResourceType.Mineral: {
        this.targets = this.game.map.getBuildingTiles(BuildingTileType.MineralMarket);
        break;
      } case ResourceType.Metal: {
        this.targets = this.game.map.getBuildingTiles(BuildingTileType.MetalMarket);
        break;
      } default: {
        this.targets = [];
      }
    }
  }

  pickTarget() {
    if (!this.currentBuildingNode || !(this.currentBuildingNode.tileType === BuildingTileType.Home && this.totalHeld === 0)) {
      super.pickTarget();
    }
  }

  finishTask() {
    if (!this.hasResourcesToGrab() && this.totalHeld === 0) {
      this.currentState = EntityState.Sleeping;
    } else if (this.currentBuildingNode && this.currentBuildingNode.tileData.subType === BuildingSubType.Market &&
        this.currentBuildingNode.health >= this.currentBuildingNode.maxHealth) {
      this.currentState = EntityState.Selling;
    } else {
      this.currentState = EntityState.MovingToTarget;
    }

    super.finishTask();
  }

  needToRestock(): boolean {
    const resourcesToSell = this.game.resources.getResources(this.resourceType, null, true);

    return resourcesToSell.every(resource => this.amountHeld(resource.resourceEnum) <= 0);
  }

  hasResourcesToGrab(): boolean {
    const resourcesToSell = this.game.resources.getResources(this.resourceType, null, true);

    return resourcesToSell.some(resource => resource.amount - resource.autoSellCutoff > 0);
  }

  restock() {
    super.restock();

    const resourcesToSell = this.game.resources.getResources(this.resourceType, null, true);
    for (let i = 0; i < resourcesToSell.length && this.totalHeld < this.resourceCapacity; i++) {
      const amountToTake = Math.min(resourcesToSell[i].amount - resourcesToSell[i].autoSellCutoff, this.resourceCapacity - this.totalHeld);

      this.takeResourceFromBase(resourcesToSell[i].resourceEnum, amountToTake);
    }
  }

  setResourceType(newResourceType: ResourceType) {
    this.resourceType = newResourceType;

    this.finishTask();
  }
}
