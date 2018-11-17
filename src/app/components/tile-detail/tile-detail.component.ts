import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { BuildingTileData, ResourceTileData, BuildingTileType, BuildingNode, ResourceNode, Market } from '../../objects/tile';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';

@Component({
  selector: 'app-tile-detail',
  templateUrl: './tile-detail.component.html',
  styleUrls: ['./tile-detail.component.css']
})
export class TileDetailComponent implements OnInit {
  buildingTileTypes = BuildingTileType;
  snapSetting = 'lowerLeft';

  constructor(public mapService: MapService,
              public buildingsService: BuildingsService,
              public resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.resourcesService.resources.get(resourceEnum);
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
    return this.mapService.buildingTileData;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTileData[] {
    let tiles = Array.from(this.mapService.buildingTileData.values());

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.buildingsService.canAffordBuilding(this.buildingTiles.get(buildingType));
  }

  upgradeBuilding() {
    const currentBuildingData = this.focusedBuildingData;
    const newBuildingData = this.upgradedBuildingData;

    this.mapService.clearBuilding(this.focusedTile.x, this.focusedTile.y);
    this.mapService.createBuilding(this.focusedTile.x, this.focusedTile.y,
      newBuildingData, true, newBuildingData.baseHealth);
  }

  canRepairBuilding(): boolean {
    return this.mapService.canRepairBuilding(this.focusedTile);
  }

  repairBuilding() {
    this.mapService.repairBuilding(this.focusedTile);
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.mapService.focusedTile;
  }

  get focusedBuildingNode(): BuildingNode {
    return this.focusedTile ? this.focusedTile.properties['buildingNode'] : null;
  }

  get focusedResourceNode(): ResourceNode {
    return this.focusedTile ? this.focusedTile.properties['resourceNode'] : null;
  }

  get marketNode(): Market {
    return this.focusedBuildingNode ? this.focusedBuildingNode.market : null;
  }

  get focusedBuildingData(): BuildingTileData {
    return this.focusedBuildingNode ? this.mapService.buildingTileData.get(this.focusedBuildingNode.tileType) : null;
  }

  get focusedResourceData(): ResourceTileData {
    return this.focusedResourceNode ? this.mapService.resourceTileData.get(this.focusedResourceNode.tileType): null;
  }

  get upgradedBuildingData(): BuildingTileData {
    return this.focusedBuildingData ? this.mapService.buildingTileData.get(this.focusedBuildingData.upgradeBuilding) : null;
  }

  get focusedResources(): Resource[] {
    if (!this.focusedResourceData) {
      return [];
    }

    const resourceEnums = this.focusedResourceData.resourceEnums;

    return resourceEnums.map(resourceEnum => this.resourcesService.resources.get(resourceEnum));
  }
}
