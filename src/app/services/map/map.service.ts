import { Injectable } from '@angular/core';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, TileCropDetail, ResourceTileType, ResourceTile } from '../../objects/tile';
import { ResourceAnimation } from '../../objects/resourceAnimation';

declare var require: any;
const Jimp = require('jimp');
const baseTiles = require('../../../assets/json/tileTypes.json');

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public tileTypes = baseTiles.tileTypes;
  public mapTiles = baseTiles.mapTiles;
  public buildingTiles = baseTiles.buildingTiles;
  public resourceTiles = baseTiles.resourceTiles;

  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];
  resourceAnimations: ResourceAnimation[] = [];

  deleteMode = false;
  selectedBuilding: BuildingTile;

  constructor(protected resourcesService: ResourcesService) {
    const _tiledMap: Tile[] = [];
    let mapTileIds: number[], resourceTileIds: number[], buildingTileIds: number[];
    let _mapWidth: number, _mapHeight: number;

    // const tileTypes = {1: MapTileType.Grass, 2: MapTileType.Water, 3: MapTileType.Mountain,
    //   7: ResourceTileType.OakTree, 8: ResourceTileType.PineTree, 9: ResourceTileType.BirchTree, 10: ResourceTileType.EucalyptusTree,
    //   11: ResourceTileType.WillowTree, 12: ResourceTileType.TeakTree, 13: ResourceTileType.DeadEnt, 14: ResourceTileType.StoneMine,
    //   15: ResourceTileType.GraphiteMine, 16: ResourceTileType.LimestoneMine, 17: ResourceTileType.MarbleMine,
    //   18: ResourceTileType.QuartzMine, 19: ResourceTileType.ObsidianMine, 20: ResourceTileType.DiamondMine,
    //   21: ResourceTileType.CopperMine, 22: ResourceTileType.TinMine, 23: ResourceTileType.IronMine, 24: ResourceTileType.GoldMine,
    //   25: ResourceTileType.LatinumMine, 26: ResourceTileType.UnbelieviumMine, 27: ResourceTileType.LustrialMine,
    //   28: ResourceTileType.SpectrusMine, 29: ResourceTileType.CrackedForge, 30: ResourceTileType.StoneForge,
    //   31: ResourceTileType.IronForge, 32: ResourceTileType.GoldForge, 33: ResourceTileType.LatinumForge,
    //   34: ResourceTileType.TemprousDistillery, 71: BuildingTileType.Home, 72: BuildingTileType.Wall,
    //   73: BuildingTileType.Road, 74: BuildingTileType.Bridge
    // };
    // const resourceIds = {7: [1], 8: [7], 9: [8], 10: [9], 11: [15], 12: [25], 13: [16], 14: [13], 15: [26], 16: [27],
    //   17: [28], 18: [29], 19: [30], 20: [31], 21: [2], 22: [3], 23: [5], 24: [11], 25: [18], 26: [20], 27: [21], 28: [22],
    //   29: [4, 5], 30: [4, 5, 6], 31: [4, 5, 6, 10, 12], 32: [4, 5, 6, 10, 12, 19], 33: [4, 5, 6, 10, 12, 19, 23], 34: [24]};

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
        id: _tiledMap.length,
        mapTileType: this.tileTypes[mapTileId],
        x: 16 * (_tiledMap.length % _mapWidth),
        y: 16 * Math.floor(_tiledMap.length / _mapWidth),
        tileCropDetail: {x: 0, y: 0, width: 16, height: 16},
        buildingRemovable: false
      };

      if (resourceTileId > 0) {
        tile.resourceTileType = this.tileTypes[resourceTileId];
      }

      if (buildingTileId > 0) {
        tile.buildingTileType = this.tileTypes[buildingTileId];
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

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = buildingTile.resourceTileType;
    }

    tile.buildingRemovable = true;
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
    if (!tile.buildingRemovable) {
      return;
    }

    const buildingTile = this.buildingTiles[tile.buildingTileType];

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = undefined;
    }

    tile.buildingTileType = undefined;
    this.calculateResourceConnections();
  }

  calculateResourceConnections() {
    const resourceTiles = this.getResourceTiles();

    for (const resourceTile of resourceTiles) {
      resourceTile.buildingPath = [];

      const visitedTiles: Tile[] = [];
      let tileQueue: Tile[] = [];
      const nodeMap = new Map<Tile, Tile>();
      let currentNode: Tile;

      for (const neighbor of this.getNeighborTiles(resourceTile)) {
        if (neighbor.buildingTileType && this.buildingTiles[neighbor.buildingTileType].resourcePathable) {
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

          buildingPath.push(backtrackNode);

          resourceTile.buildingPath = buildingPath.reverse();
          tileQueue = [];
        }

        for (const neighbor of this.getNeighborTiles(currentNode)) {
          if (!visitedTiles.includes(neighbor) && neighbor.buildingTileType &&
            this.buildingTiles[neighbor.buildingTileType].resourcePathable) {
            nodeMap.set(neighbor, currentNode);
            tileQueue.push(neighbor);
          }
        }

        visitedTiles.push(currentNode);
      }
    }
  }

  spawnResourceAnimation(resourceId: number) {
    const matchingTiles = this.getTilesForResource(resourceId).filter(tile => tile.buildingPath.length > 0);

    const tile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];

    this.resourceAnimations.push({
      resourceId: resourceId,
      x: tile.x + 4,
      y: tile.y + 4,
      buildingPath: tile.buildingPath.map(tile => tile),
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
    const matchingTypes = this.resourceTileArray.filter(tile => tile.resourceIds.includes(resourceId)).map(tile => tile.tileType);

    if (resourceId !== undefined) {
      tiles = tiles.filter(tile => matchingTypes.includes(tile.resourceTileType));
    }

    return tiles;
  }

  resourceTileUsable(resourceId: number) {
    const matchingTiles = this.getTilesForResource(resourceId);

    return (matchingTiles.length > 0 && matchingTiles.some(tile => tile.buildingPath.length > 0));
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

  get mapTileArray(): MapTile[] {
    const tiles: MapTile[] = [];

    for (const key in this.mapTiles) {
      tiles.push(this.mapTiles[key]);
    }

    return tiles;
  }

  getTilesForResource(resourceId: number) {
    const matchingTypes = this.resourceTileArray.filter(tile => tile.resourceIds.includes(resourceId)).map(tile => tile.tileType);

    return this.tiledMap.filter(tile => matchingTypes.includes(tile.resourceTileType));
  }

  get buildingTileArray(): BuildingTile[] {
    const tiles: BuildingTile[] = [];

    for (const key in this.buildingTiles) {
      tiles.push(this.buildingTiles[key]);
    }

    return tiles;
  }

  get resourceTileArray(): ResourceTile[] {
    const tiles: ResourceTile[] = [];

    for (const key in this.resourceTiles) {
      tiles.push(this.resourceTiles[key]);
    }

    return tiles;
  }
}
