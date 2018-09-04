import { Injectable } from '@angular/core';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, TileCropDetail, ResourceTile } from '../../objects/tile';
import { ResourceAnimation, Projectile, Entity } from '../../objects/entity';

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

  public mapTileArray: MapTile[] = [];
  public buildingTileArray: BuildingTile[] = [];
  public resourceTileArray: ResourceTile[] = [];

  public enemySpawnTiles: Tile[] = [];

  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];
  resourceAnimations: ResourceAnimation[] = [];
  projectiles: Projectile[] = [];

  deleteMode = false;
  selectedBuilding: BuildingTile = this.buildingTiles[BuildingTileType.Road];

  lastAnimationTime = 0;
  tileAnimationSpeed = 0.003;
  enemyAnimationSpeed = 0.003;
  projectileAnimationSpeed = 0.003;

  highFramerate = 25;
  lowFramerate = 125;

  tilePixelSize = 16;
  gridWidth = 150;
  gridHeight = 150;
  canvasPixelWidth: number;
  canvasPixelHeight: number;

  constructor(protected resourcesService: ResourcesService) {
    const _tiledMap: Tile[] = [];
    let mapTileIds: number[], resourceTileIds: number[], buildingTileIds: number[], flagTileIds: number[];
    let _mapWidth: number, _mapHeight: number;

    for (const key in this.mapTiles) {
      if (this.mapTiles.hasOwnProperty(key)) {
        this.mapTileArray.push(this.mapTiles[key]);
      }
    }

    for (const key in this.buildingTiles) {
      if (this.buildingTiles.hasOwnProperty(key)) {
        this.buildingTileArray.push(this.buildingTiles[key]);
      }
    }

    for (const key in this.resourceTiles) {
      if (this.resourceTiles.hasOwnProperty(key)) {
        this.resourceTileArray.push(this.resourceTiles[key]);
      }
    }

    const xmlRequest = new XMLHttpRequest();
    xmlRequest.onload = function() {
      const xmlDoc = new DOMParser().parseFromString(xmlRequest.responseText, 'text/xml');
      const layers = xmlDoc.getElementsByTagName('layer');
      let mapLayer: Element, resourceLayer: Element, buildingLayer: Element, flagLayer: Element;

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
          case 'Flag Layer':
            flagLayer = layers[i];
            break;
        }
      }

      _mapWidth = +mapLayer.attributes.getNamedItem('width').value;
      _mapHeight = +mapLayer.attributes.getNamedItem('height').value;

      mapTileIds = mapLayer.textContent.split(',').map(tileId => +tileId);
      resourceTileIds = resourceLayer.textContent.split(',').map(tileId => +tileId);
      buildingTileIds = buildingLayer.textContent.split(',').map(tileId => +tileId);
      flagTileIds = flagLayer.textContent.split(',').map(tileId => +tileId);
    };

    xmlRequest.open('GET', '../../../assets/tilemap/map.tmx', false);
    xmlRequest.send();

    for (let i = 0; i < mapTileIds.length; i++) {
      const mapTileId = mapTileIds[i];
      const resourceTileId = resourceTileIds[i];
      const buildingTileId = buildingTileIds[i];
      const flagTileId = flagTileIds[i];

      const tile: Tile = {
        id: _tiledMap.length,
        mapTileType: this.tileTypes[mapTileId],
        health: 50,
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

      const flagTileType = this.tileTypes[flagTileId];
      if (flagTileType === BuildingTileType.EnemyPortal) {
        this.enemySpawnTiles.push(tile);
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

    for (const resource of this.resourcesService.resources) {
      resource.pathAvailable = false;
    }

    const homeTile = this.tiledMap.filter(tile => tile.buildingTileType === BuildingTileType.Home)[0];

    for (const resourceTile of resourceTiles) {
      resourceTile.buildingPath = [];

      resourceTile.buildingPath = this.findPath(resourceTile, homeTile, true, true);

      const resources = this.resourceTiles[resourceTile.resourceTileType].resourceIds.map(id => this.resourcesService.getResource(id));
      for (const resource of resources) {
        resource.pathAvailable = true;
      }
    }
  }

  findPath(startTile: Tile, targetTile: Tile, onlyPathable: boolean, onlyWalkable: boolean): Tile[] {
    const visitedTiles: Tile[] = [];

    let tileQueue: Tile[] = [];
    const tileDistances = this.tiledMap.map(_ => this.tiledMap.length + 1);
    const nodeMap = new Map<Tile, Tile>();

    let currentNode: Tile;

    tileDistances[startTile.id] = 0;

    tileQueue.push(startTile);

    while (tileQueue.length) {
      currentNode = tileQueue.sort((a, b) => tileDistances[a.id] - tileDistances[b.id])[0];
      tileQueue = tileQueue.filter(tile => tile !== currentNode);

      if (currentNode === targetTile) {
        const buildingPath: Tile[] = [];

        let backtrackNode = currentNode;
        while (backtrackNode !== startTile) {
          buildingPath.push(backtrackNode);
          backtrackNode = nodeMap.get(backtrackNode);
        }

        buildingPath.push(backtrackNode);
        return buildingPath.reverse();
      }

      const neighborDistance = tileDistances[currentNode.id] + 1;

      for (const neighbor of this.getNeighborTiles(currentNode)) {
        const pathable = neighbor.buildingTileType && this.buildingTiles[neighbor.buildingTileType].resourcePathable;
        const walkable = this.mapTiles[neighbor.mapTileType].walkable || pathable;

        if (!visitedTiles.includes(neighbor) && (!onlyPathable || pathable) && (!onlyWalkable || walkable) &&
            tileDistances[neighbor.id] > neighborDistance) {
          nodeMap.set(neighbor, currentNode);
          tileDistances[neighbor.id] = neighborDistance;
          tileQueue.push(neighbor);
        }
      }

      visitedTiles.push(currentNode);
    }

    return [];
  }

  spawnResourceAnimation(resourceId: number, multiplier: number = 1, spawnedByPlayer: boolean) {
    const matchingTiles = this.getTilesForResource(resourceId).filter(_tile => _tile.buildingPath.length > 0);

    const tile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
    if (tile === undefined) {
      return;
    }

    this.resourceAnimations.push({
      name: '',
      resourceId: resourceId,
      multiplier: multiplier,
      spawnedByPlayer: spawnedByPlayer,
      x: tile.x + 4,
      y: tile.y + 4,
      currentTile: tile,
      tilePath: tile.buildingPath.map(_tile => _tile),
      pathStep: 0,
      pathingDone: false,
      health: -1,
      maxHealth: -1
    });
  }

  spawnProjectile(owner: Entity, target: Entity) {
    this.projectiles.push({
      name: 'Arrow',
      x: owner.x,
      y: owner.y,
      currentTile: owner.currentTile,
      tilePath: [],
      pathStep: -1,
      pathingDone: true,
      health: 1,
      maxHealth: 1,
      owner: owner,
      target: target,
      rotation: 0
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

  clampTileCoordinates(x: number, y: number) {
    return [Math.floor(x / 16) * 16, Math.floor(y / 16) * 16];
  }

  getResourceTiles(resourceId?: number): Tile[] {
    let tiles = this.tiledMap.filter(tile => tile.resourceTileType !== undefined);
    const matchingTypes = this.resourceTileArray.filter(tile => tile.resourceIds.includes(resourceId)).map(tile => tile.tileType);

    if (resourceId !== undefined) {
      tiles = tiles.filter(tile => matchingTypes.includes(tile.resourceTileType));
    }

    return tiles;
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

  getTilesForResource(resourceId: number) {
    const matchingTypes = this.resourceTileArray.filter(tile => tile.resourceIds.includes(resourceId)).map(tile => tile.tileType);

    return this.tiledMap.filter(tile => matchingTypes.includes(tile.resourceTileType));
  }
}
