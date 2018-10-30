import { BuildingNode, ResourceNode } from './../../objects/tile';
import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { BuildingTileData, ResourceTileData, BuildingTileType } from '../../objects/tile';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';

@Component({
  selector: 'app-tile-detail',
  templateUrl: './tile-detail.component.html',
  styleUrls: ['./tile-detail.component.css']
})
export class TileDetailComponent implements OnInit {
  buildingTileTypes = BuildingTileType;
  snapSetting = 'free';

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
      currentBuildingData.upgradeBuilding, true, newBuildingData.baseHealth);
  }

  canRepairBuilding(): boolean {
    return this.buildingsService.canRepairBuilding(tile);
  }

  repairBuilding() {
    this.buildingsService.repairBuilding(tile);
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.mapService.focusedTile;
  }

  get focusedBuildingNode(): BuildingNode {
    return this.focusedTile.properties['buildingNode'];
  }

  get focusedResourceNode(): ResourceNode {
    return this.focusedTile.properties['resourceNode'];
  }

  get focusedBuildingData(): BuildingTileData {
    return this.mapService.buildingTileData.get(this.focusedBuildingNode.tileType);
  }

  get focusedResourceData(): ResourceTileData {
    return this.mapService.resourceTileData.get(this.focusedResourceNode.tileType);
  }

  get upgradedBuildingData(): BuildingTileData {
    return this.mapService.buildingTileData.get(this.focusedBuildingData.upgradeBuilding);
  }

  get focusedResources(): Resource[] {
    const resourceEnums = this.focusedResourceData.resourceEnums;

    return resourceEnums.map(resourceEnum => this.resourcesService.resources.get(resourceEnum));
  }
}
