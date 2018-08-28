import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MapTileType, Tile, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';

declare var d3: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  deleteMode = false;
  selectedBuilding: BuildingTile;

  tilePixels = 48;

  topLeftX = 0;
  topLeftY = 0;
  windowWidth = 15;
  windowHeight = 15;

  canvas;
  context: CanvasRenderingContext2D;
  transform = d3.zoomIdentity;

  width: number;
  height: number;
  images = [{name: 'map', x: 0, y: 0, width: 1600, height: 1600}];

  constructor(protected mapService: MapService,
              protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
    this.selectedBuilding = this.buildingTiles[BuildingTileType.Wall];
  }

  ngAfterViewInit() {
    this.canvas = d3.select('canvas');
    this.context = this.canvas.node().getContext('2d');

    this.width = this.canvas.property('width');
    this.height = this.canvas.property('height');

    this.canvas.call(d3.zoom()
        .scaleExtent([1 / 2, 4])
        .translateExtent([[0, 0], [2400, 2400]])
        .on('zoom', this.zoomed(this)));

    this.canvas.on('click', this.clickTile(this));

    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    this.drawCanvas();
    this.context.restore();
  }

  zoomed(self: MapComponent) {
    return function(d) {
      self.transform = d3.event.transform;

      self.context.save();
      self.context.clearRect(0, 0, self.width, self.height);
      self.context.translate(self.transform.x, self.transform.y);
      self.context.scale(self.transform.k, self.transform.k);
      self.drawCanvas();
      self.context.restore();
    }
  }

  clickTile(self: MapComponent) {
    return function(d) {
      const coordinates = d3.mouse(this);
      coordinates[0] = Math.floor(self.transform.invertX(coordinates[0]) / 16);
      coordinates[1] = Math.floor(self.transform.invertY(coordinates[1]) / 16);

      const tile = self.mapService.tiledMap[coordinates[0] + coordinates[1] * self.mapService.mapWidth];

      if (self.deleteMode) {
        self.clearBuilding(tile);
      } else {
        self.createBuilding(tile, self.selectedBuilding.tileType);
      }

      self.context.save();
      self.context.clearRect(0, 0, self.width, self.height);
      self.context.translate(self.transform.x, self.transform.y);
      self.context.scale(self.transform.k, self.transform.k);
      self.drawCanvas();
      self.context.restore();
    }
  }

  drawCanvas() {
    this.mapService.loadImages();
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.mapService.canAffordBuilding(this.buildingTiles[buildingType]);
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

    return this.buildingTiles[this.selectedTile.buildingTileType];
  }

  get buildingTiles() {
    return this.mapService.buildingTiles;
  }

  get buildingTileArray(): BuildingTile[] {
    const buildingTiles: BuildingTile[] = [];

    for (const key in this.buildingTiles) {
      buildingTiles.push(this.buildingTiles[key]);
    }

    return buildingTiles;
  }

  get rowCount(): number {
    return this.mapService.getRowCount();
  }

  get columnCount(): number {
    return this.mapService.getColumnCount();
  }
}
