import { Injectable } from '@angular/core';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, TileCropDetail, ResourceTileType } from '../../objects/tile';
import { ResourceAnimation } from '../../objects/resourceAnimation';

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
  resourceAnimations: ResourceAnimation[] = [];

  walkableMapTiles = [MapTileType.Grass];

  deleteMode = false;
  selectedBuilding: BuildingTile;

  context: CanvasRenderingContext2D;

  constructor(protected resourcesService: ResourcesService) {
    const _tiledMap: Tile[] = [];
    let mapTileIds: number[], resourceTileIds: number[], buildingTileIds: number[];
    let _mapWidth: number, _mapHeight: number;

    const tileTypes = {1: MapTileType.Grass, 2: MapTileType.Water, 3: MapTileType.Mountain,
      7: ResourceTileType.OakTree, 8: ResourceTileType.PineTree, 9: ResourceTileType.BirchTree, 10: ResourceTileType.EucalyptusTree,
      11: ResourceTileType.WillowTree, 12: ResourceTileType.TeakTree, 13: ResourceTileType.DeadEnt,
      50: BuildingTileType.Home, 51: BuildingTileType.Wall, 52: BuildingTileType.Road, 53: BuildingTileType.Bridge
    };
    const resourceIds = {7: 1, 8: 7, 9: 8, 10: 9, 11: 15, 12: 25, 13: 16};

    const xmlRequest = new XMLHttpRequest();
    xmlRequest.onload = function() {
      const xmlDoc = new DOMParser().parseFromString(xmlRequest.responseText, 'text/xml');
      const layers = xmlDoc.getElementsByTagName('layer');
      let mapLayer: Element, resourceLayer: Element, buildingLayer: Element;

      for (let i = 0; i < layers.length; i++) {
        switch (layers[i].attributes['name'].value) {
          case 'Map Layer':
            mapLayer = layers[i];
            break;
          case 'Resource Layer':
            resourceLayer = layers[i];
            break;
          case 'Building Layer':
            buildingLayer = layers[i];
            break;
        }
      }

      _mapWidth = +mapLayer.attributes.getNamedItem('width').value;
      _mapHeight = +mapLayer.attributes.getNamedItem('height').value;

      mapTileIds = mapLayer.textContent.split(',').map(tileId => +tileId);
      resourceTileIds = resourceLayer.textContent.split(',').map(tileId => +tileId);
      buildingTileIds = buildingLayer.textContent.split(',').map(tileId => +tileId);
    };

    xmlRequest.open('GET', '../../../assets/tilemap/map.tmx', false);
    xmlRequest.send();

    for (let i = 0; i < mapTileIds.length; i++) {
      const mapTileId = mapTileIds[i];
      const resourceTileId = resourceTileIds[i];
      const buildingTileId = buildingTileIds[i];

      const tile: Tile = {
        mapTileType: tileTypes[mapTileId],
        x: 16 * (_tiledMap.length % _mapWidth),
        y: 16 * Math.floor(_tiledMap.length / _mapWidth),
        tileCropDetail: {x: 0, y: 0, width: 16, height: 16}
      };

      if (resourceTileId > 0) {
        tile.resourceTileType = tileTypes[resourceTileId];
        tile.resourceId = resourceIds[resourceTileId];
      }

      if (buildingTileId > 0) {
        tile.buildingTileType = tileTypes[buildingTileId];
      }

      _tiledMap.push(tile);
    }

    this.tiledMap = _tiledMap;
    this.mapWidth = _mapWidth;
    this.mapHeight = _mapHeight;

    this.calculateResourceConnections();
  }

  createBuilding(tile: Tile, buildingType: BuildingTileType): boolean {
    const buildingTile = this.buildingTiles[buildingType];

    if (tile.buildingTileType !== undefined ||
        tile.resourceTileType !== undefined ||
        !buildingTile.buildableSurfaces.some(bs => bs === tile.mapTileType) ||
        !this.canAffordBuilding(buildingTile)) {
      return false;
    }

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, -resourceCost.resourceCost);
    }

    tile.buildingTileType = buildingType;
    this.calculateResourceConnections();

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

  calculateResourceConnections() {
    const resourceTiles = this.getResourceTiles();

    for (const resourceTile of resourceTiles) {
      const visitedTiles: Tile[] = [];
      let tileQueue: Tile[] = [];
      const nodeMap = new Map<Tile, Tile>();
      let currentNode: Tile;

      for (const neighbor of this.getNeighborTiles(resourceTile)) {
        if (neighbor.buildingTileType === BuildingTileType.Road || neighbor.buildingTileType === BuildingTileType.Home) {
          tileQueue.push(neighbor);
        }
      }

      tileQueue.push(resourceTile);

      while (tileQueue.length) {
        currentNode = tileQueue.pop();

        if (currentNode.buildingTileType === BuildingTileType.Home) {
          const buildingPath: Tile[] = [];
          let backtrackNode = currentNode;

          while (backtrackNode !== resourceTile) {
            buildingPath.push(backtrackNode);
            backtrackNode = nodeMap.get(backtrackNode);
          }

          resourceTile.buildingPath = buildingPath.reverse();
          tileQueue = [];
        }

        for (const neighbor of this.getNeighborTiles(currentNode)) {
          if (!visitedTiles.includes(neighbor) &&
              (neighbor.buildingTileType === BuildingTileType.Road || neighbor.buildingTileType === BuildingTileType.Home)) {
            nodeMap.set(neighbor, currentNode);
            tileQueue.push(neighbor);
          }
        }

        visitedTiles.push(currentNode);
      }
    }
  }

  spawnResourceAnimation(resourceId: number) {
    const resourceTiles = this.getResourceTiles().filter(resourceTile => resourceTile.resourceId === resourceId);
    const tile = resourceTiles[Math.floor(Math.random() * resourceTiles.length)];

    this.resourceAnimations.push({
      resourceId: resourceId,
      x: tile.x + 4,
      y: tile.y + 4,
      sourceTile: tile,
      currentTile: tile,
      destinationTile: tile.buildingPath[0],
      pathStep: 0,
      done: false
    });
  }

  getNeighborTiles(tile: Tile): Tile[] {
    const tileCoordinates = this.getTileCoordinates(tile);

    const neighborPositions = [
      {x: tileCoordinates.x - 1, y: tileCoordinates.y},
      {x: tileCoordinates.x + 1, y: tileCoordinates.y},
      {x: tileCoordinates.x, y: tileCoordinates.y - 1},
      {x: tileCoordinates.x, y: tileCoordinates.y + 1}
    ];

    const tiles: Tile[] = [];
    for (const position of neighborPositions) {
      if (position.x >= 0 && position.x < this.mapWidth &&
          position.y >= 0 && position.y < this.mapHeight) {
        tiles.push(this.getTile(position.x, position.y));
      }
    }

    return tiles;
  }

  getRowCount(): number {
    return this.mapHeight;
  }

  getColumnCount(): number {
    return this.mapWidth;
  }

  getTileCoordinates(tile: Tile) {
    const tileIndex = this.tiledMap.indexOf(tile);

    return {
      x: tileIndex % this.mapWidth,
      y: Math.floor(tileIndex / this.mapWidth)
    };
  }

  getTile(x: number, y: number) {
    return this.tiledMap[x + y * this.mapWidth];
  }

  getResourceTiles(resourceId?: number): Tile[] {
    let tiles = this.tiledMap.filter(tile => tile.resourceTileType !== undefined);

    if (resourceId !== undefined) {
      tiles = tiles.filter(tile => tile.resourceId === resourceId);
    }

    return tiles;
  }

  resourceTileUsable(resourceId: number) {
    const tiles = this.tiledMap.filter(tile => tile.resourceTileType !== undefined && tile.resourceId === resourceId);

    return (tiles.length > 0 && tiles.some(tile => tile.buildingPath !== undefined));
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
