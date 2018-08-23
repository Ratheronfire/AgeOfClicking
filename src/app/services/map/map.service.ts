import { Injectable } from '@angular/core';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';

declare var require: any;
const Jimp = require('jimp');
const baseTiles = require('../../../assets/json/tileTypes.json');

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public mapTiles: MapTile[] = baseTiles.mapTiles;
  public buildingTiles: BuildingTile[] = baseTiles.buildingTiles;

  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];

  walkableMapTiles = [MapTileType.Grass];

  cameraY = 100;
  cameraX = 100;
  cameraTile: Tile;

  constructor(protected resourcesService: ResourcesService) {
    const _tiledMap: Tile[] = [];
    const tileTypes = [MapTileType.Grass, MapTileType.Water, MapTileType.Mountain];
    let _mapWidth: number, _mapHeight: number;

    const xmlRequest = new XMLHttpRequest();
    xmlRequest.onload = function() {
      const xmlDoc = new DOMParser().parseFromString(xmlRequest.responseText, 'text/xml');
      const mapValues = xmlDoc.getElementsByTagName('data')[0].textContent;
      const layerData = xmlDoc.getElementsByTagName('layer')[0];

      _mapWidth = +layerData.attributes.getNamedItem('width').value;
      _mapHeight = +layerData.attributes.getNamedItem('height').value;

      mapValues.split(',').map(tileIndex => _tiledMap.push({mapTileType: tileTypes[+tileIndex - 1]}));
    };

    xmlRequest.open('GET', '../../../assets/tilemap/map.tmx', false);
    xmlRequest.send();

    this.tiledMap = _tiledMap;
    this.mapWidth = _mapWidth;
    this.mapHeight = _mapHeight;
  }

  createBuilding(tile: Tile, buildingType: BuildingTileType): boolean {
    const buildingTile = this.buildingTiles[buildingType];

    if (tile.buildingTileType !== undefined ||
        !buildingTile.buildableSurfaces.some(bs => bs === tile.mapTileType) ||
        !this.canAffordBuilding(buildingTile)) {
      return false;
    }

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, -resourceCost.resourceCost);
    }

    tile.buildingTileType = buildingType;
    return true;
  }

  public canAffordBuilding(buildingTile: BuildingTile): boolean {
    for (const resourceCost of buildingTile.resourceCosts) {
      if (this.resourcesService.getResource(resourceCost.resourceId).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  clearBuilding(tile: Tile) {
    tile.buildingTileType = undefined;
  }

  getRowCount(): number {
    return this.mapHeight;
  }

  getColumnCount(): number {
    return this.mapWidth;
  }

  getTile(x: number, y: number) {
    return this.tiledMap[x + y * this.mapWidth];
  }

  getMap(clampToWindow: boolean, topLeftX: number, topLeftY: number, windowWidth: number, windowHeight: number): Tile[] {
    if (!clampToWindow) {
      return this.tiledMap;
    }

    const submap: Tile[] = [];

    for (let i = topLeftY; i < topLeftY + windowHeight; i++) {
      for (let j = topLeftX; j < topLeftX + windowWidth; j++) {
        submap.push(this.getTile(j, i));
      }
    }

    return submap;
  }

  getMapTileSprite(tile: Tile) {
    return this.mapTiles[tile.mapTileType].spritePath;
  }

  getBuildingTileSprite(tile: Tile) {
    return this.buildingTiles[tile.buildingTileType].spritePath;
  }

  canMove(newLocationX: number, newLocationY: number): boolean {
    return newLocationX >= 0 && newLocationX < this.mapWidth &&
           newLocationY >= 0 && newLocationY < this.mapHeight;
  }

  getCameraLocation(): number[] {
    return [this.cameraX, this.cameraY];
  }

  setCameraLocation(xOffset: number, yOffset: number): boolean {
    const newLocationX = this.cameraX + xOffset;
    const newLocationY = this.cameraY + yOffset;

    if (!this.canMove(newLocationX, newLocationY)) {
      return false;
    }

    this.cameraX = newLocationX;
    this.cameraY = newLocationY;
    this.cameraTile = this.getTile(newLocationX, newLocationY);

    return true;
  }
}
