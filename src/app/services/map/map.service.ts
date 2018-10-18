import { Injectable, EventEmitter } from '@angular/core';

import { Observable, of } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { StoreService } from './../store/store.service';
import { Tick } from './../tick/tick.service';
import { ResourceEnum } from './../../objects/resourceData';
import { Tile, MapTileType, BuildingTileType, MapTile, BuildingTile, ResourceTile, Market, ResourceTileType } from '../../objects/tile';
import { Resource } from '../../objects/resource';
import { ResourceAnimation, Projectile, Actor, Fighter, ResourceAnimationType } from '../../objects/entity';
import { Vector } from '../../objects/vector';

declare var require: any;
const Jimp = require('jimp');
const baseTiles = require('../../../assets/json/tileTypes.json');

import * as prng from 'prng-parkmiller-js';
import * as SimplexNoise from 'simplex-noise';

import * as d3 from 'd3-zoom';

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
export class MapService implements Tick {
  public tileTypes = baseTiles.tileTypes;

  public mapTiles: Map<string, MapTile> = new Map<string, MapTile>();
  public buildingTiles: Map<string, BuildingTile> = new Map<string, BuildingTile>();
  public resourceTiles: Map<string, ResourceTile> = new Map<string, ResourceTile>();

  cursorTool: CursorTool;

  buildingListVisible = false;
  fighterListVisible = false;

  focusedTile: Tile;
  focusedFighter: Fighter;
  focusedBuildingTile: BuildingTile;
  focusedResourceTile: ResourceTile;
  focusedResources: Resource[];

  chunkWidth = 75;
  chunkHeight = 75;

  totalChunkX = 5;
  totalChunkY = 5;

  elevationMap: number[] = [];

  public tileMap: Tile[] = [];
  resourceAnimations: ResourceAnimation[] = [];
  projectiles: Projectile[] = [];

  deleteMode = false;

  tileAnimationSpeed = 0.003;
  enemyAnimationSpeed = 0.003;
  projectileAnimationSpeed = 0.003;

  highFramerate = 25;
  lowFramerate = 125;

  tilePixelSize = 16;

  rng: any;

  prngSeed: number;
  mapSeed: number;
  resourceSeed: number;

  // Shared canvas elements
  public onMapUpdate: EventEmitter<any> = new EventEmitter<any>();
  transform = d3.zoomIdentity;
  imageElements = {};

  canvasPixelWidth: number;
  canvasPixelHeight: number;

  constructor(protected resourcesService: ResourcesService,
              protected storeService: StoreService) {
    this.seedRng(Math.random());

    for (const tileTypeString in MapTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = MapTileType[tileTypeString];
        this.mapTiles.set(tileType, baseTiles.mapTiles[tileType]);
      }
    }

    for (const tileTypeString in BuildingTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = BuildingTileType[tileTypeString];
        this.buildingTiles.set(tileType, baseTiles.buildingTiles[tileType]);
      }
    }

    for (const tileTypeString in ResourceTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = ResourceTileType[tileTypeString];
        this.resourceTiles.set(tileType, baseTiles.resourceTiles[tileType]);
      }
    }

    const imageElementContainer = document.getElementById('tile-images');
    for (let i = 0; i < imageElementContainer.children.length; i++) {
      const imageElement = imageElementContainer.children[i];
      this.imageElements[imageElement.id] = imageElement;
    }
  }

  seedRng(seed: number) {
    this.prngSeed = seed;
    this.rng = prng.create(seed);

    this.mapSeed = this.rng.nextInt();
    this.resourceSeed = this.rng.nextInt();
  }

  initializeMap() {
    this.tileMap = [];

    for (let y = 0; y < this.totalChunkY; y++) {
      for (let x = 0; x < this.totalChunkX; x++) {
        this.generateChunk(x, y);
      }
    }

    // Placing home (unless one already exists)
    // We want to place the home closer to the center of the map.
    const homeTile = this.getRandomTile([MapTileType.Grass], true, this.totalChunkX * 0.4 * this.chunkWidth,
                                                                   this.totalChunkX * 0.6 * this.chunkWidth,
                                                                   this.totalChunkY * 0.4 * this.chunkHeight,
                                                                   this.totalChunkY * 0.6 * this.chunkHeight);
    homeTile.buildingTileType = BuildingTileType.Home;
    homeTile.buildingRemovable = false;

    // Placing an oak tree & stone mine near the home, to ensure they're always available.
    // We want to vary up their positions a bit to feel more natural.
    let grassTiles: Tile[] = [], mountainTiles: Tile[] = [];
    const placedRoads: Tile[] = [];

    let oakTile: Tile, stoneTile: Tile;
    let currentTile = homeTile;

    for (let i = 0; i < this.rng.nextIntRange(7, 16); i++) {
      let neighbors = this.getNeighborTiles(currentTile);

      const existingOakTile = neighbors.find(tile => tile.resourceTileType === ResourceTileType.OakTree);
      if (existingOakTile) {
        oakTile = existingOakTile;
      }

      const existingStoneTile = neighbors.find(tile => tile.resourceTileType === ResourceTileType.StoneMine);
      if (existingStoneTile) {
        stoneTile = existingStoneTile;
      }

      grassTiles = grassTiles.concat(neighbors.filter(tile => tile.mapTileType === MapTileType.Grass));
      mountainTiles = mountainTiles.concat(neighbors.filter(tile => tile.mapTileType === MapTileType.Mountain));

      neighbors = neighbors.filter(tile => !tile.buildingTileType && !tile.resourceTileType && tile.mapTileType === MapTileType.Grass);

      if (!neighbors.length) {
        currentTile = grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
      } else {
        currentTile = neighbors[this.rng.nextIntRange(0, neighbors.length - 1)];
      }
      currentTile.buildingTileType = BuildingTileType.Road;
      placedRoads.push(currentTile);
    }

    grassTiles = grassTiles.filter(tile => !tile.buildingTileType && !tile.resourceTileType);
    mountainTiles = mountainTiles.filter(tile => !tile.buildingTileType && !tile.resourceTileType);

    if (!oakTile) {
      oakTile = grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
      grassTiles = grassTiles.filter(tile => tile !== oakTile);
    }

    if (!stoneTile) {
      stoneTile = mountainTiles.length ? mountainTiles[this.rng.nextIntRange(0, mountainTiles.length - 1)] :
                                            grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
    }

    oakTile.resourceTileType = ResourceTileType.OakTree;
    stoneTile.resourceTileType = ResourceTileType.StoneMine;

    this.updatePaths(homeTile, true);

    for (const roadTile of placedRoads) {
      if (!oakTile.buildingPath.includes(roadTile) && !stoneTile.buildingPath.includes(roadTile)) {
        roadTile.buildingTileType = undefined;
      } else {
        roadTile.buildingRemovable = false;
      }
    }

    // Final sweep to make sure all spawnable resources exist at least once.
    let naturalResources = Array.from(this.resourceTiles.values());
    naturalResources = naturalResources.filter(resource => resource.isNaturalResource);
    naturalResources = naturalResources.filter(resource => !this.tileMap.some(tile => tile.resourceTileType === resource.tileType));

    for (const missingResource of naturalResources) {
      const resourceTile = this.getRandomTile(missingResource.spawnsOn, true);
      resourceTile.resourceTileType = missingResource.tileType;
    }

    this.calculateResourceConnections();

    this.onMapUpdate.emit();
  }

  generateChunk(chunkX: number, chunkY: number) {
    const mapGen = new SimplexNoise(this.mapSeed.toString());
    const resourceGen = new SimplexNoise(this.resourceSeed.toString());

    const chunkTopLeft = new Vector(chunkX * this.chunkWidth, chunkY * this.chunkHeight);
    const chunkBottomRight = new Vector(chunkTopLeft.x + this.chunkWidth, chunkTopLeft.y + this.chunkHeight);

    // Creating the map itself
    for (let y = chunkTopLeft.y; y < chunkBottomRight.y; y++) {
      for (let x = chunkTopLeft.x; x < chunkBottomRight.x; x++) {
        const noiseValue = this.adjustedNoise(x, y, mapGen);
        const tileId = this.getChunkOffset(x, y) + y * this.chunkWidth + x;

        const tile = new Tile(tileId, this.getBiome(noiseValue), undefined, undefined, true,
                              new Vector(16 * x, 16 * y), undefined, 50, noiseValue, this.resourcesService);
        this.setTile(x, y, tile);
      }
    }

    const centerVector = new Vector(this.totalChunkX * this.chunkWidth * this.tilePixelSize / 2,
      this.totalChunkY * this.chunkHeight * this.tilePixelSize / 2);
    const maxTier = Math.max(...this.resourcesService.getResources().map(resource => resource.resourceTier));
    const tierRingSize = centerVector.magnitude / maxTier;

    // Placing resources
    for (let y = chunkTopLeft.y; y < chunkBottomRight.y; y++) {
      for (let x = chunkTopLeft.x; x < chunkBottomRight.x; x++) {
        const adjustX = x / this.chunkWidth - 0.5, adjustY = y / this.chunkHeight - 0.5;
        const noiseValue = this.noise(adjustX, adjustY, resourceGen);

        let maxNoise = 0;
        const scanRange = 2;

        // Check nearby tiles to see if this tile is higher than all of them
        for (let ny = y - scanRange; ny < y + scanRange; ny++) {
          for (let nx = x - scanRange; nx < x + scanRange; nx++) {
            const neighborTile = this.getTile(nx, ny);
            if (neighborTile && neighborTile.noiseValue > maxNoise) {
              maxNoise = neighborTile.noiseValue;
            }
          }
        }

        const tile = this.getTile(x, y);
        if (tile.noiseValue === maxNoise) {
          const distanceToCenter = new Vector(Math.abs(tile.x - centerVector.x), Math.abs(tile.y - centerVector.y)).magnitude;
          const tierValue = Math.floor(distanceToCenter / tierRingSize);

          let naturalResources = Array.from(this.resourceTiles.values());
          naturalResources = naturalResources.filter(resource => resource.spawnsOn.includes(tile.mapTileType));
          naturalResources = naturalResources.filter(resource => {
            const resourceTiers = resource.resourceEnums.map(resourceEnum =>
              this.resourcesService.resources.get(resourceEnum).resourceTier);
            return resourceTiers.some(tier => tierValue - tier <= 3);
          });

          if (!naturalResources.length) {
            continue;
          }

          const rollRange = naturalResources.map(resource => resource.spawnRate).reduce((total, rate) => total += rate);
          let resourceDiceRoll = this.rng.nextDouble() * rollRange;

          for (const resource of naturalResources) {
            resourceDiceRoll -= resource.spawnRate;
            if (resourceDiceRoll <= 0) {
              tile.resourceTileType = resource.tileType;
              break;
            }
          }
        }
      }
    }
  }

  clearChunk(chunkX: number, chunkY: number) {
    const chunkTopLeft = new Vector(chunkX * this.chunkWidth, chunkY * this.chunkHeight);
    const chunkBottomRight = new Vector(chunkTopLeft.x + this.chunkWidth, chunkTopLeft.y + this.chunkHeight);

    // TODO: Store building data outside of tile map, simulate offscreen production
    for (let y = chunkTopLeft.y; y < chunkBottomRight.y; y++) {
      for (let x = chunkTopLeft.x; x < chunkBottomRight.x; x++) {
        this.setTile(x, y, undefined);
      }
    }
  }

  tick(elapsed: number, deltaTime: number) {
    for (const resourceAnimation of this.resourceAnimations) {
      resourceAnimation.tick(elapsed, deltaTime);

      if (resourceAnimation.pathingDone) {
        resourceAnimation.finishAnimation();
      }
    }

    for (const tile of this.tileMap.filter(_tile => _tile.market)) {
      tile.market.tick(elapsed, deltaTime);
    }

    this.resourceAnimations = this.resourceAnimations.filter(animation => !animation.pathingDone);

    for (const projectile of this.projectiles) {
      projectile.tick(elapsed, deltaTime);
    }

    this.projectiles = this.projectiles.filter(projectile => !projectile.hitTarget);
  }

  adjustedNoise(x: number, y: number, generator: SimplexNoise): number {
    const nx = x / this.chunkWidth - 0.5, ny = y / this.chunkHeight - 0.5;
    const noiseValue = this.noise(1 * nx, 1 * ny, generator) +
                0.25 * this.noise(4 * nx, 4 * ny, generator) +
               0.125 * this.noise(8 * nx, 8 * ny, generator);
    return noiseValue ** 6;
  }

  noise(x: number, y: number, generator: SimplexNoise): number {
    return generator.noise2D(x, y) / 2 + 0.5;
  }

  getBiome(noiseValue: number): MapTileType {
    if (noiseValue <= 0.25) {
      return MapTileType.Water;
    } else if (noiseValue < 0.9999999) {
      return MapTileType.Grass;
    } else {
      return MapTileType.Mountain;
    }
  }

  updatePaths(updatedTile: Tile, onlyPathable: boolean) {
    const visitedTiles: Tile[] = [];
    const tileQueue: Tile[] = [];
    let currentTile: Tile;

    tileQueue.push(updatedTile);

    const homeTile = this.tileMap.filter(tile => tile.buildingTileType === BuildingTileType.Home)[0];

    while (tileQueue.length) {
      currentTile = tileQueue.pop();

      const neighborTiles = this.getNeighborTiles(currentTile);
      visitedTiles.push(currentTile);

      for (const neighbor of neighborTiles) {
        const buildingTile = this.buildingTiles.get(neighbor.buildingTileType);
        if (!visitedTiles.includes(neighbor) &&
            (!onlyPathable || ((buildingTile && buildingTile.resourcePathable)) || neighbor.resourceTileType)) {
          tileQueue.push(neighbor);
        }
      }

      if (!currentTile.resourceTileType) {
        continue;
      }

      this.findPath(currentTile, homeTile, true, true).subscribe(tilePath => {
        currentTile.buildingPath = tilePath;

        const pathAvailable = currentTile.buildingPath.length && !currentTile.buildingPath.some(tile => tile.health <= 0);
        const resources = this.resourceTiles.get(currentTile.resourceTileType).resourceEnums
            .map(resourceEnum => this.resourcesService.resources.get(resourceEnum));

        for (const resource of resources) {
          resource.pathAvailable = pathAvailable;
        }
      });
    }
  }

  calculateResourceConnections() {
    const resourceTiles = this.getResourceTiles();

    for (const resource of this.resourcesService.getResources()) {
      resource.pathAvailable = false;
    }

    const homeTile = this.tileMap.filter(tile => tile.buildingTileType === BuildingTileType.Home)[0];

    for (const resourceTile of resourceTiles) {
      if (resourceTile.health <= 0) {
        continue;
      }

      this.findPath(resourceTile, homeTile, true, true).subscribe(tilePath => {
        resourceTile.buildingPath = tilePath;

        if (resourceTile.buildingPath.length && !resourceTile.buildingPath.some(tile => tile.health <= 0)) {
          const resources = this.resourceTiles.get(resourceTile.resourceTileType).resourceEnums
            .map(resourceEnum => this.resourcesService.resources.get(resourceEnum));
          for (const resource of resources) {
            resource.pathAvailable = true;
          }
        }
      });
    }

    for (const marketTile of this.tileMap.filter(tile => tile.market)) {
      marketTile.market.calculateConnection();
    }
  }

  findPath(startTile: Tile, targetTile: Tile, onlyPathable: boolean, onlyWalkable: boolean,
      maxAttempts: number = Infinity): Observable<Tile[]> {
    const visitedTiles: Tile[] = [];

    let tileQueue: Tile[] = [];

    const tileDistances = this.tileMap.map(_ => Infinity);
    const tileHeuristicDistances = this.tileMap.map(_ => Infinity);

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

      tileQueue = tileQueue.sort((a, b) => tileHeuristicDistances[a.id] - tileHeuristicDistances[b.id]);
      currentNode = tileQueue.pop();

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
        const pathable = neighbor.buildingTileType && this.buildingTiles.get(neighbor.buildingTileType).resourcePathable;
        const walkable = this.mapTiles.get(neighbor.mapTileType).walkable || pathable;

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

  spawnHarvestedResourceAnimation(resource: Resource, multiplier: number = 1, spawnedByPlayer: boolean) {
    const matchingTiles = this.getResourceTiles(resource.resourceEnum).filter(_tile => _tile.buildingPath.length > 0);

    if (!resource.canAfford(multiplier)) {
      return;
    }

    resource.deductResourceConsumes(multiplier);

    const tile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
    if (tile === undefined) {
      return;
    }

    const tilePathCopy = tile.buildingPath.map(_tile => _tile);
    const animationType = spawnedByPlayer ? ResourceAnimationType.PlayerSpawned : ResourceAnimationType.WorkerSpawned;

    const resourceAnimation = new ResourceAnimation(new Vector(tile.x, tile.y), tile,
      0.003, tilePathCopy, animationType, resource.resourceEnum, multiplier, spawnedByPlayer, this.resourcesService, this.storeService);
    this.resourceAnimations.push(resourceAnimation);
  }

  spawnSoldResourceAnimation(resourceEnum: ResourceEnum, multiplier: number, market: Market) {
    const resourceAnimation = new ResourceAnimation(new Vector(market.homeTile.x, market.homeTile.y),
      market.homeTile, 0.003, market.tilePath, ResourceAnimationType.Sold,
      resourceEnum, multiplier, false, this.resourcesService, this.storeService);
    this.resourceAnimations.push(resourceAnimation);
  }

  spawnProjectile(owner: Actor, target: Actor) {
    const projectile = new Projectile('Arrow', new Vector(owner.x, owner.y),
      owner.currentTile, 0.006, owner, target);
    this.projectiles.push(projectile);
  }

  getRandomTile(tileTypes?: MapTileType[], avoidResources = false, minX = 0, maxX = Infinity, minY = 0, maxY = Infinity): Tile {
    let tiles = this.tileMap;
    if (minX > 0 || minY > 0 || maxX < Infinity || maxY < Infinity) {
      tiles = tiles.filter(_tile => _tile.x / this.tilePixelSize >= minX && _tile.x / this.tilePixelSize <= maxX &&
        _tile.y / this.tilePixelSize >= minY && _tile.y / this.tilePixelSize <= maxY);
    }

    let tile: Tile;

    do {
      tile = tiles[Math.floor(this.rng.nextDouble() * tiles.length)];
    } while (!tile || !(!tileTypes || tileTypes.includes(tile.mapTileType)) || (avoidResources && tile.resourceTileType));

    return tile;
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
      if (position.x >= 0 && position.x < this.totalChunkX * this.chunkWidth &&
          position.y >= 0 && position.y < this.totalChunkY * this.chunkHeight) {
        tiles.push(this.getTile(position.x, position.y));
      }
    }

    return tiles;
  }

  getTileCoordinates(tile: Tile) {
    return {
      x: Math.floor(tile.x / this.tilePixelSize),
      y: Math.floor(tile.y / this.tilePixelSize)
    };
  }

  getChunkOffset(x: number, y: number) {
    const chunkIndex = Math.floor(x / this.chunkWidth) + this.totalChunkX * Math.floor(y / this.chunkHeight);
    return chunkIndex * this.chunkWidth * this.chunkHeight;
  }

  getTile(x: number, y: number) {
    return this.tileMap[this.getChunkOffset(x, y) + y * this.chunkWidth + x];
  }

  setTile(x: number, y: number, tile: Tile) {
    this.tileMap[this.getChunkOffset(x, y) + y * this.chunkWidth + x] = tile;
  }

  setCameraCenter(center: Vector) {
    const bounds = this.getMapCameraBounds();

    const oldCenter = bounds[1].add(bounds[0]).multiply(0.5);
    const centerOffset = oldCenter.subtract(bounds[0]);

    this.transform.x = center.x + centerOffset.x;
    this.transform.y = center.y + centerOffset.y;

    const newBounds = this.getMapCameraBounds();

    const upperLeftBorder = [0, 0];
    const bottomRightBorder = [-this.totalChunkX * this.chunkWidth * this.tilePixelSize,
                               -this.totalChunkY * this.chunkHeight * this.tilePixelSize];

    // Adjust the camera to stay in-bounds
    if (this.transform.x > upperLeftBorder[0]) {
      this.transform.x = upperLeftBorder[0];
    } else if (-newBounds[1].x < bottomRightBorder[0]) {
      this.transform.x = (bottomRightBorder[0] + centerOffset.x * 2) * this.transform.k;
    }
    if (this.transform.y > upperLeftBorder[1]) {
      this.transform.y = upperLeftBorder[1];
    } else if (-newBounds[1].y < bottomRightBorder[1]) {
      this.transform.y = (bottomRightBorder[1] + centerOffset.y * 2) * this.transform.k;
    }
  }

  clampTileCoordinates(x: number, y: number) {
    return [Math.floor(x / this.tilePixelSize), Math.floor(y / this.tilePixelSize)];
  }

  getResourceTiles(resourceEnum?: ResourceEnum): Tile[] {
    let tiles = this.tileMap.filter(tile => tile.resourceTileType);

    if (resourceEnum) {
      const matchingTypes = Array.from(this.resourceTiles.values()).filter(
        tile => tile.resourceEnums.includes(resourceEnum)).map(tile => tile.tileType);
      tiles = tiles.filter(tile => matchingTypes.includes(tile.resourceTileType));
    }

    return tiles;
  }

  getMapCameraBounds(extendedBorder = 0): Vector[] {
    const upperLeftPixel =
     new Vector((-this.transform.x - this.tilePixelSize * extendedBorder) / this.transform.k,
                (-this.transform.y - this.tilePixelSize * extendedBorder) / this.transform.k);
    const lowerRightPixel =
      new Vector(upperLeftPixel.x + (this.canvasPixelWidth + this.tilePixelSize * extendedBorder) / this.transform.k,
                 upperLeftPixel.y + (this.canvasPixelHeight + this.tilePixelSize * extendedBorder) / this.transform.k);

    return [upperLeftPixel, lowerRightPixel];
  }
}
