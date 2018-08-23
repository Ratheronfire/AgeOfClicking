import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';

import { MapTileType, Tile, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  showSelectedTileDialog = false;
  selectedTile: Tile;
  selectedBuilding: BuildingTile;

  tilePixels = 48;

  topLeftX = 0;
  topLeftY = 0;
  windowWidth = 15;
  windowHeight = 15;

  constructor(protected mapService: MapService,
              protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
    this.setCameraLocation(0, 0);

    this.selectedBuilding = this.mapService.buildingTiles[BuildingTileType.Wall];
  }

  @HostListener('document:keypress', ['$event'])
  processMapInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        this.setCameraLocation(0, -1);
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        this.setCameraLocation(-1, 0);
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        this.setCameraLocation(0, 1);
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        this.setCameraLocation(1, 0);
        break;
    }
  }

  selectTile(tile: Tile) {
    this.selectedTile = tile;
    this.showSelectedTileDialog = true;
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.mapService.canAffordBuilding(this.mapService.buildingTiles[buildingType]);
  }

  createBuilding(tile: Tile, buildingType: BuildingTileType) {
    const buildingCreated = this.mapService.createBuilding(tile, buildingType);

    this.showSelectedTileDialog = !buildingCreated;
  }

  clearBuilding(tile: Tile) {
    this.mapService.clearBuilding(tile);
  }

  getMap(clampToWindow: boolean): Tile[] {
    return this.mapService.getMap(clampToWindow, this.topLeftX, this.topLeftY, this.windowWidth, this.windowHeight);
  }

  getMapTileSprite(tile: Tile) {
    return this.mapService.getMapTileSprite(tile);
  }

  getBuildingTileSprite(tile: Tile) {
    return this.mapService.getBuildingTileSprite(tile);
  }

  getCameraLocation(): number[] {
    return this.mapService.getCameraLocation();
  }

  setCameraLocation(xOffset: number, yOffset: number) {
    const moveSuccessful = this.mapService.setCameraLocation(xOffset, yOffset);

    if (!moveSuccessful) {
      return;
    }

    this.topLeftX = Math.floor(this.mapService.cameraX - this.windowWidth / 2);
    this.topLeftY = Math.floor(this.mapService.cameraY - this.windowHeight / 2);

    if (this.topLeftX < 0) {
      this.topLeftX = 0;
    } else if (this.topLeftX + this.windowWidth > this.mapService.mapWidth) {
      this.topLeftX = this.mapService.mapWidth - this.windowWidth;
    }
    if (this.topLeftY < 0) {
      this.topLeftY = 0;
    } else if (this.topLeftY + this.windowHeight > this.mapService.mapHeight) {
      this.topLeftY = this.mapService.mapHeight - this.windowHeight;
    }

    const cameraCenter = this.getCameraLocation();

    const distanceFromCenterX = Math.abs(cameraCenter[0] - (this.topLeftX + this.windowWidth / 2));
    const distanceFromCenterY = Math.abs(cameraCenter[1] - (this.topLeftY + this.windowHeight / 2));

    const newCameraX = this.topLeftX + xOffset;
    const newCameraY = this.topLeftY + yOffset;

    if (newCameraX >= 0 && newCameraX + this.windowWidth <= this.getColumnCount() && distanceFromCenterX >= 1) {
      this.topLeftX = newCameraX;
    }
    if (newCameraY >= 0 && newCameraY + this.windowHeight <= this.getRowCount() && distanceFromCenterY >= 1) {
      this.topLeftY = newCameraY;
    }
  }

  get selectedMapTile(): MapTile {
    if (this.selectedTile === undefined) {
      return undefined;
    }

    return this.mapService.mapTiles[this.selectedTile.mapTileType];
  }

  get selectedBuildingTile(): BuildingTile {
    if (this.selectedTile === undefined || this.selectedTile.buildingTileType === undefined) {
      return undefined;
    }

    return this.mapService.buildingTiles[this.selectedTile.buildingTileType];
  }

  getRowCount(): number {
    return this.mapService.getRowCount();
  }

  getColumnCount(): number {
    return this.mapService.getColumnCount();
  }
}
