import { Injectable } from '@angular/core';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, TileCropDetail, TileImage } from '../../objects/tile';

declare var require: any;
const Jimp = require('jimp');
const baseTiles = require('../../../assets/json/tileTypes.json');

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public mapTiles: Map<MapTileType, MapTile> = baseTiles.mapTiles;
  public buildingTiles: Map<BuildingTileType, BuildingTile> = baseTiles.buildingTiles;

  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];

  walkableMapTiles = [MapTileType.Grass];

  cameraY = 100;
  cameraX = 100;
  cameraTile: Tile;

  context: CanvasRenderingContext2D;

  constructor(protected resourcesService: ResourcesService) {
    const _tiledMap: Tile[] = [];
    let tileIds: number[];
    let _mapWidth: number, _mapHeight: number;

    const tileTypes = [MapTileType.Grass, MapTileType.Water, MapTileType.Mountain];

    const xmlRequest = new XMLHttpRequest();
    xmlRequest.onload = function() {
      const xmlDoc = new DOMParser().parseFromString(xmlRequest.responseText, 'text/xml');
      const mapValues = xmlDoc.getElementsByTagName('data')[0].textContent;
      const layerData = xmlDoc.getElementsByTagName('layer')[0];

      _mapWidth = +layerData.attributes.getNamedItem('width').value;
      _mapHeight = +layerData.attributes.getNamedItem('height').value;

      tileIds = mapValues.split(',').map(tileId => +tileId);
    };

    xmlRequest.open('GET', '../../../assets/tilemap/map.tmx', false);
    xmlRequest.send();

    for (const tileId of tileIds) {
      _tiledMap.push({mapTileType: tileTypes[tileId - 1],
                     x: 16 * (_tiledMap.length % _mapWidth),
                     y: 16 * Math.floor(_tiledMap.length / _mapWidth),
                     tileCropDetail: {x: 0, y: 0, width: 16, height: 16}});
    }

    this.tiledMap = _tiledMap;
    this.mapWidth = _mapWidth;
    this.mapHeight = _mapHeight;
  }

  loadImages() {
    for (const tile of this.tiledMap) {
      const mapTileImage = <HTMLImageElement> document.getElementById(tile.mapTileType.toLowerCase());
      this.context.drawImage(mapTileImage, tile.x, tile.y, 16, 16);

      if (tile.buildingTileType) {
        console.log(tile.buildingTileType);
        const buildingTileImage = <HTMLImageElement> document.getElementById(tile.buildingTileType.toLowerCase());
        this.context.drawImage(buildingTileImage, tile.x, tile.y, 16, 16);
      }
    }
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

  getTileType(tileId: number): MapTileType {
    if (tileId in [37, 38, 39, 40, 41, 42, 43, 44, 54, 55, 56, 57, 58, 59, 60, 61, 71, 72, 73, 74, 75, 76, 77, 78, 88,
      89, 90, 91, 92, 93, 94, 95, 105, 106, 107, 108, 109, 110, 111, 112, 123, 124, 125, 126, 127, 128, 129, 130]) {
      return MapTileType.Grass;
    } else if (tileId in [53, 122]) {
      return MapTileType.Water;
    }

    return MapTileType.Mountain;
  }

  getTileCropDetail(tileId: number): TileCropDetail {
    return {x: 0, y: 0, width: 16, height: 16};
  }
}
