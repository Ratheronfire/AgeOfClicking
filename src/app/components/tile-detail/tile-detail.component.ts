import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Tile, BuildingTile, ResourceTile, BuildingTileType } from '../../objects/tile';
import { Resource } from '../../objects/resource';

@Component({
  selector: 'app-tile-detail',
  templateUrl: './tile-detail.component.html',
  styleUrls: ['./tile-detail.component.css']
})
export class TileDetailComponent implements OnInit {
  buildingTileTypes = BuildingTileType;

  constructor(protected mapService: MapService,
              protected buildingsService: BuildingsService,
              protected resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  getResource(resourceId: number): Resource {
    return this.resourcesService.getResource(resourceId);
  }

  clearFocus() {
    this.focusedTile = undefined;
    this.focusedBuildingTile = undefined;
    this.focusedResourceTile = undefined;
    this.focusedResources = undefined;
  }

  canAffordUpgrade(upgradeBuilding: BuildingTile) {
    for (const resourceCost of upgradeBuilding.resourceCosts) {
      if (this.resourcesService.getResource(resourceCost.resourceId).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  get buildingTiles() {
    return this.mapService.buildingTiles;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTile[] {
    let tiles = this.mapService.buildingTileArray;

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.buildingsService.canAffordBuilding(this.buildingTiles[buildingType]);
  }

  upgradeBuilding(tile: Tile) {
    const currentBuilding = this.mapService.buildingTiles[tile.buildingTileType];

    this.buildingsService.clearBuilding(tile);
    this.buildingsService.createBuilding(tile, currentBuilding.upgradeBuilding);

    this.focusedBuildingTile = this.mapService.buildingTiles[tile.buildingTileType];
    this.focusedResourceTile = this.mapService.resourceTiles[tile.resourceTileType];
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

  get focusedBuildingTile(): BuildingTile {
    return this.mapService.focusedBuildingTile;
  }

  set focusedBuildingTile(value: BuildingTile) {
    this.mapService.focusedBuildingTile = value;
  }

  get focusedResourceTile(): ResourceTile {
    return this.mapService.focusedResourceTile;
  }

  set focusedResourceTile(value: ResourceTile) {
    this.mapService.focusedResourceTile = value;
  }

  get focusedResources(): Resource[] {
    return this.mapService.focusedResources;
  }

  set focusedResources(value: Resource[]) {
    this.mapService.focusedResources = value;
  }
}
