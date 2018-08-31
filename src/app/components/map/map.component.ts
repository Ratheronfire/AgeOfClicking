import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MapTileType, Tile, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
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
              protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  selectBuilding(buildingTile: BuildingTile) {
    if (this.selectedBuilding === buildingTile) {
      this.selectedBuilding = undefined;
    } else {
      this.selectedBuilding = buildingTile;
    }
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.mapService.canAffordBuilding(this.buildingTiles[buildingType]);
  }

  createBuilding(tile: Tile, buildingType: BuildingTileType) {
    const buildingCreated = this.mapService.createBuilding(tile, buildingType);
  }

  clearBuilding(tile: Tile) {
    this.mapService.clearBuilding(tile);
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

  get deleteMode(): boolean {
    return this.mapService.deleteMode;
  }

  set deleteMode(value) {
    this.mapService.deleteMode = value;
  }

  get selectedBuilding(): BuildingTile {
    return this.mapService.selectedBuilding;
  }

  set selectedBuilding(value) {
    this.mapService.selectedBuilding = value;
  }

  get rowCount(): number {
    return this.mapService.getRowCount();
  }

  get columnCount(): number {
    return this.mapService.getColumnCount();
  }
}
