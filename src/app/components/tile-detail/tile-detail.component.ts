import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Tile, BuildingTileData, ResourceTileData, BuildingTileType } from '../../objects/tile';
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

  upgradeBuilding(tile: Tile) {
    const currentBuilding = this.mapService.buildingTileData.get(tile.buildingTileType);

    this.buildingsService.clearBuilding(tile);
    this.buildingsService.createBuilding(tile, currentBuilding.upgradeBuilding);

    this.focusedBuildingTile = this.mapService.buildingTileData.get(tile.buildingTileType);
    this.focusedResourceTile = this.mapService.resourceTileData.get(tile.resourceTileType);
  }

  canRepairBuilding(tile: Tile): boolean {
    return this.buildingsService.canRepairBuilding(tile);
  }

  repairBuilding(tile: Tile) {
    this.buildingsService.repairBuilding(tile);
  }

  get focusedTile(): Tile {
    return this.mapService.focusedTile;
  }

  set focusedTile(value: Tile) {
    this.mapService.focusedTile = value;
  }

  get focusedBuildingTile(): BuildingTileData {
    return this.mapService.focusedBuildingTile;
  }

  set focusedBuildingTile(value: BuildingTileData) {
    this.mapService.focusedBuildingTile = value;
  }

  get focusedResourceTile(): ResourceTileData {
    return this.mapService.focusedResourceTile;
  }

  set focusedResourceTile(value: ResourceTileData) {
    this.mapService.focusedResourceTile = value;
  }

  get focusedResources(): Resource[] {
    return this.mapService.focusedResources;
  }

  set focusedResources(value: Resource[]) {
    this.mapService.focusedResources = value;
  }
}
