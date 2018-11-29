import { Component, OnInit } from '@angular/core';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';
import { BuildingNode, TileStats } from '../../objects/tile/buildingNode';
import { Market } from '../../objects/tile/market';
import { ResourceNode } from '../../objects/tile/resourceNode';
import { BuildingTileData, BuildingTileType, ResourceTileData } from '../../objects/tile/tile';
import { GameService } from './../../game/game.service';

@Component({
  selector: 'app-tile-detail',
  templateUrl: './tile-detail.component.html',
  styleUrls: ['./tile-detail.component.css']
})
export class TileDetailComponent implements OnInit {
  buildingTileTypes = BuildingTileType;
  snapSetting = 'lowerLeft';

  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.game.resources.getResource(resourceEnum);
  }

  canAffordUpgrade(upgradeBuilding: BuildingTileData) {
    for (const resourceCost of upgradeBuilding.resourceCosts) {
      if (this.getResource(resourceCost.resourceEnum).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  get buildingTiles() {
    return this.game.map.buildingTileData;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTileData[] {
    let tiles = Array.from(this.game.map.buildingTileData.values());

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.game.buildings.canAffordBuilding(this.buildingTiles.get(buildingType));
  }

  upgradeBuilding() {
    const newBuildingData = this.upgradedBuildingData;

    this.game.map.clearBuilding(this.focusedTile.x, this.focusedTile.y);
    this.game.map.createBuilding(this.focusedTile.x, this.focusedTile.y,
      newBuildingData, true, newBuildingData.baseHealth);
  }

  canRepairBuilding(): boolean {
    return this.game.map.canRepairBuilding(this.focusedTile, this.focusedBuildingNode.maxHealth - this.focusedBuildingNode.health);
  }

  repairBuilding() {
    this.game.map.repairBuilding(this.focusedTile, this.focusedBuildingNode.maxHealth - this.focusedBuildingNode.health);
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.game.map.focusedTile;
  }

  get focusedBuildingNode(): BuildingNode {
    return this.focusedTile ? this.focusedTile.properties['buildingNode'] : null;
  }

  get focusedResourceNode(): ResourceNode {
    return this.focusedTile ? this.focusedTile.properties['resourceNode'] : null;
  }

  get focusedBuildingData(): BuildingTileData {
    return this.focusedBuildingNode ? this.game.map.buildingTileData.get(this.focusedBuildingNode.tileType) : null;
  }

  get focusedResourceData(): ResourceTileData {
    return this.focusedResourceNode ? this.game.map.resourceTileData.get(this.focusedResourceNode.tileType) : null;
  }

  get upgradedBuildingData(): BuildingTileData {
    return this.focusedBuildingData ? this.game.map.buildingTileData.get(this.focusedBuildingData.upgradeBuilding) : null;
  }

  get focusedResources(): Resource[] {
    if (!this.focusedResourceData) {
      return [];
    }

    const resourceEnums = this.focusedResourceData.resourceEnums;

    return resourceEnums.map(resourceEnum => this.game.resources.getResource(resourceEnum));
  }

  get focusedMarket(): Market {
    if (!this.focusedBuildingNode || !(this.focusedBuildingNode instanceof Market)) {
      return null;
    }

    return this.focusedBuildingNode as Market;
  }

  get focusedStats(): TileStats {
    if (!this.focusedBuildingNode) {
      return null;
    }

    return this.focusedBuildingNode.stats;
  }
}
