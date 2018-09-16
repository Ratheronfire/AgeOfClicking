import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, TileCropDetail, ResourceTile } from '../../objects/tile';
import { Resource } from '../../objects/resource';
import { ResourceAnimation, Projectile, Actor, Fighter } from '../../objects/entity';
import { Vector } from '../../objects/vector';

declare var require: any;
const Jimp = require('jimp');
const baseTiles = require('../../../assets/json/tileTypes.json');

export enum CursorTool {
  PlaceBuildings = 'PLACEBUILDINGS',
  ClearBuildings = 'CLEARBUILDINGS',
  TileDetail = 'TILEDETAIL',
  PlaceFighters = 'PLACEFIGHTERS',
  FighterDetail = 'FIGHTERDETAIL'
}

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

  cursorTool: CursorTool;

  buildingListVisible = false;
  fighterListVisible = false;

  focusedTile: Tile;
  focusedFighter: Fighter;
  focusedBuildingTile: BuildingTile;
  focusedResourceTile: ResourceTile;
  focusedResources: Resource[];

  public enemySpawnTiles: Tile[] = [];

  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];
  resourceAnimations: ResourceAnimation[] = [];
  projectiles: Projectile[] = [];

  deleteMode = false;

  lastAnimationTime = 0;
  tileAnimationSpeed = 0.003;
  enemyAnimationSpeed = 0.003;
  projectileAnimationSpeed = 0.003;

  highFramerate = 25;
  lowFramerate = 125;

  canvasWidth = 750;
  canvasHeight = 750;

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

      const position = new Vector(16 * (_tiledMap.length % _mapWidth), 16 * Math.floor(_tiledMap.length / _mapWidth));
      const tileCropDetail = {x: 0, y: 0, width: 16, height: 16};

      let resourceTileType, buildingTileType;

      if (resourceTileId > 0) {
        resourceTileType = this.tileTypes[resourceTileId];
      }

      if (buildingTileId > 0) {
        buildingTileType = this.tileTypes[buildingTileId];
      }

      const tile = new Tile(_tiledMap.length, this.tileTypes[mapTileId],
        resourceTileType, buildingTileType, false, position, tileCropDetail, 50);

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

  calculateResourceConnections() {
    const resourceTiles = this.getResourceTiles();

    for (const resource of this.resourcesService.resources) {
      resource.pathAvailable = false;
    }

    const homeTile = this.tiledMap.filter(tile => tile.buildingTileType === BuildingTileType.Home)[0];

    for (const resourceTile of resourceTiles) {
      if (resourceTile.health <= 0) {
        continue;
      }

      this.findPath(resourceTile, homeTile, true, true).subscribe(tilePath => {
      resourceTile.buildingPath = tilePath;

      if (resourceTile.buildingPath.length && !resourceTile.buildingPath.some(tile => tile.health <= 0)) {
        const resources = this.resourceTiles[resourceTile.resourceTileType].resourceIds.map(id => this.resourcesService.getResource(id));
        for (const resource of resources) {
          resource.pathAvailable = true;
        }
      }
      });
    }
  }

  findPath(startTile: Tile, targetTile: Tile, onlyPathable: boolean, onlyWalkable: boolean,
      maxAttempts: number = Infinity): Observable<Tile[]> {
    const visitedTiles: Tile[] = [];

    let tileQueue: Tile[] = [];
    const tileDistances = this.tiledMap.map(_ => Infinity);
    const tileHeuristicDistances = this.tiledMap.map(_ => Infinity);
    const nodeMap = new Map<Tile, Tile>();

    let currentNode: Tile;

    tileDistances[startTile.id] = 0;

    tileQueue.push(startTile);

    let nodesProcessed = 0;

    while (tileQueue.length) {
      nodesProcessed++;
      if (nodesProcessed > maxAttempts) {
        break;
      }

      currentNode = tileQueue.sort((a, b) => tileHeuristicDistances[a.id] - tileHeuristicDistances[b.id])[0];
      tileQueue = tileQueue.filter(tile => tile !== currentNode);

      if (currentNode === targetTile) {
        const buildingPath: Tile[] = [];

        let backtrackNode = currentNode;
        while (backtrackNode !== startTile) {
          buildingPath.push(backtrackNode);
          backtrackNode = nodeMap.get(backtrackNode);
        }

        buildingPath.push(backtrackNode);

        return of(buildingPath.reverse());
      }

      const neighborDistance = tileDistances[currentNode.id] + 1;

      for (const neighbor of this.getNeighborTiles(currentNode)) {
        const pathable = neighbor.buildingTileType && this.buildingTiles[neighbor.buildingTileType].resourcePathable;
        const walkable = this.mapTiles[neighbor.mapTileType].walkable || pathable;

        if (!visitedTiles.includes(neighbor) && (!onlyPathable || pathable) && (!onlyWalkable || walkable) &&
            tileDistances[neighbor.id] > neighborDistance) {
          nodeMap.set(neighbor, currentNode);

          tileDistances[neighbor.id] = neighborDistance;
          tileHeuristicDistances[neighbor.id] = neighborDistance + targetTile.position.subtract(neighbor.position).magnitude;

          tileQueue.push(neighbor);
        }
      }

      visitedTiles.push(currentNode);
    }

    return of([]);
  }

  getRandomTile(tileTypes?: MapTileType[]): Tile {
    let tiles = this.tiledMap;

    if (tileTypes) {
      tiles = tiles.filter(tile => tileTypes.some(tileType => tileType === tile.mapTileType));
    }

    return tiles[Math.floor(Math.random() * tiles.length)];
  }

  spawnResourceAnimation(resourceId: number, multiplier: number = 1, spawnedByPlayer: boolean) {
    const matchingTiles = this.getTilesForResource(resourceId).filter(_tile => _tile.buildingPath.length > 0);

    if (!this.resourcesService.canAffordResource(resourceId, multiplier)) {
      return;
    }

    this.resourcesService.decuctResourceConsumes(resourceId, multiplier);

    const tile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
    if (tile === undefined) {
      return;
    }

    const tilePathCopy = tile.buildingPath.map(_tile => _tile);

    const resourceAnimation = new ResourceAnimation(new Vector(tile.x, tile.y), tile,
      resourceId, multiplier, spawnedByPlayer, tilePathCopy);
    this.resourceAnimations.push(resourceAnimation);
  }

  spawnProjectile(owner: Actor, target: Actor) {
    const projectile = new Projectile('Arrow', new Vector(owner.x, owner.y),
      owner.currentTile, owner, target);
    this.projectiles.push(projectile);
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
    return [Math.floor(x / this.tilePixelSize), Math.floor(y / this.tilePixelSize)];
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
