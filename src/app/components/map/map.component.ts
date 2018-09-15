import { ResourceTile } from './../../objects/tile';
import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MapTileType, Tile, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { BuildingsService } from './../../services/buildings/buildings.service';
import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Resource } from '../../objects/resource';

declare var d3: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  constructor(protected mapService: MapService,
              protected buildingsService: BuildingsService,
              protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
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

  getResource(resourceId: number): Resource {
    return this.resourcesService.getResource(resourceId);
  }

  canAffordUpgrade(upgradeBuilding: BuildingTile) {
    for (const resourceCost of upgradeBuilding.resourceCosts) {
      if (this.resourcesService.getResource(resourceCost.resourceId).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
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

  clearFocus() {
    this.focusedTile = undefined;
    this.focusedBuildingTile = undefined;
    this.focusedResourceTile = undefined;
    this.focusedResources = undefined;
  }

  get canvasWidth(): number {
    return this.mapService.canvasWidth;
  }

  get canvasHeight(): number {
    return this.mapService.canvasHeight;
  }

  get deleteMode(): boolean {
    return this.mapService.deleteMode;
  }

  set deleteMode(value) {
    this.mapService.deleteMode = value;
  }

  get rowCount(): number {
    return this.mapService.getRowCount();
  }

  get columnCount(): number {
    return this.mapService.getColumnCount();
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
