import { ResourceTile } from './../../objects/tile';
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

  get focusedBuildingTile(): BuildingTile {
    return this.mapService.focusedBuildingTile;
  }

  get focusedResourceTile(): ResourceTile {
    return this.mapService.focusedResourceTile;
  }

  get focusedResources(): Resource[] {
    return this.mapService.focusedResources;
  }
}
