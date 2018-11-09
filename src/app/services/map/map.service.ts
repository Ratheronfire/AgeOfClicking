import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { StoreService } from './../store/store.service';
import { BuildingsService } from '../buildings/buildings.service';
import { FighterService } from './../fighter/fighter.service';
import { EnemyService } from './../enemy/enemy.service';
import { MessagesService } from './../messages/messages.service';
import { ResourceEnum, ResourceType } from './../../objects/resourceData';
import { MapTileType, BuildingTileType, MapTileData, BuildingTileData, ResourceTileData,
  Market, ResourceTileType, BuildingNode, ResourceNode, BuildingSubType } from '../../objects/tile';
import { Resource } from '../../objects/resource';
import { ResourceAnimation, Projectile, Actor, Fighter, ResourceAnimationType, FighterData, EnemyData, Enemy } from '../../objects/entity';
import { Vector } from '../../objects/vector';

declare var require: any;
const baseTiles = require('../../../assets/json/tileTypes.json');

import * as prng from 'prng-parkmiller-js';
import * as SimplexNoise from 'simplex-noise';

export enum CursorTool {
  PlaceBuildings = 'PLACEBUILDINGS',
  ClearBuildings = 'CLEARBUILDINGS',
  TileDetail = 'TILEDETAIL',
  PlaceFighters = 'PLACEFIGHTERS',
  FighterDetail = 'FIGHTERDETAIL',
  PathfindingTest = 'PATHFINDINGTEST'
}

interface TileCoordinate {
  x: number;
  y: number;
}

interface TileIsland {
  tiles: TileCoordinate[];
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public mapTileData: Map<string, MapTileData> = new Map<string, MapTileData>();
  public buildingTileData: Map<string, BuildingTileData> = new Map<string, BuildingTileData>();
  public resourceTileData: Map<string, ResourceTileData> = new Map<string, ResourceTileData>();

  mapManager: Phaser.Game;

  cursorTool: CursorTool;

  buildingListVisible = false;
  fighterListVisible = false;

  focusedTile: Phaser.Tilemaps.Tile;
  focusedFighter: Fighter;

  chunkWidth = 50;
  chunkHeight = 50;

  totalChunkX = 4;
  totalChunkY = 4;

  resourceAnimationSpeed = 5;
  enemyAnimationSpeed = 5;
  projectileAnimationSpeed = 5;

  tilePixelSize = 16;

  // Map generation/rng variables

  rng: any;

  prngSeed: number;
  mapSeed: number;
  resourceSeed: number;

  // Phaser variables

  canvasContainer: HTMLElement;

  tileIndices = {
    'GRASS': 14, 'MOUNTAIN': 18, 'WATER': 36, 'HOME': 0, 'WALL': 1, 'ROAD': 2, 'TUNNEL': 3, 'BRIDGE': 4, 'CRACKEDFORGE': 5, 'STONEFORGE': 6,
    'IRONFORGE': 7, 'GOLDFORGE': 8, 'LATINUMFORGE': 9, 'TEMPROUSDISTILLERY': 10, 'OAKOVEN': 11, 'STONEOVEN': 12, 'MARBLEOVEN': 13,
    'TEMPROUSOVEN': 14, 'CHICKENFARM': 15, 'COWFARM': 16, 'DRAGONFARM': 17, 'WOODMARKET': 18, 'MINERALMARKET': 19, 'METALMARKET': 20,
    'ENEMYPORTAL': 21, 'GOLD': 0, 'OAK': 1, 'EUCALYPTUS': 2, 'STONE': 3, 'COPPERORE': 4, 'IRONINGOT': 5, 'JELLYDONUT': 6, 'PINE': 7,
    'BIRCH': 8, 'WILLOW': 9, 'GRAPHITE': 10, 'TINORE': 11, 'STEELINGOT': 12, 'RAWHERRING': 13, 'TEAK': 14, 'ENTSOUL': 15,
    'REANIMATEDENT': 16, 'LIMESTONE': 17, 'IRONORE': 18, 'GOLDINGOT': 19, 'HERRING': 20, 'MARBLE': 21, 'QUARTZ': 22,
    'OBSIDIAN': 23, 'DIAMOND': 24, 'GOLDORE': 25, 'LATINUMINGOT': 26, 'RAWBASS': 27, 'LATINUMORE': 28, 'UNBELIEVIUMORE': 29,
    'LUSTRIALORE': 30, 'SPECTRUSORE': 31, 'BRONZEINGOT': 32, 'TEMPROUSINGOT': 33, 'BASS': 34, 'REFINEDTEMPROUS': 35,
    'WHEAT': 36, 'BREAD': 37, 'RAWPOTATO': 38, 'POTATO': 39, 'RICE': 40, 'RAWSHARK': 41, 'SHARK': 42, 'RAWCHICKEN': 43, 'CHICKEN': 44,
    'RAWSTEAK': 45, 'STEAK': 46, 'RAWDRAGONMEAT': 47, 'DRAGONMEAT': 48, 'OAKTREE': 0, 'PINETREE': 1, 'BIRCHTREE': 2, 'EUCALYPTUSTREE': 3,
    'WILLOWTREE': 4, 'TEAKTREE': 5, 'DEADENT': 6, 'STONEMINE': 7, 'GRAPHITEMINE': 8, 'LIMESTONEMINE': 9, 'MARBLEMINE': 10, 'QUARTZMINE': 11,
    'OBSIDIANMINE': 12, 'DIAMONDMINE': 13, 'COPPERMINE': 14, 'TINMINE': 15, 'IRONMINE': 16, 'GOLDMINE': 17, 'LATINUMMINE': 18,
    'UNBELIEVIUMMINE': 19, 'LUSTRIALMINE': 20, 'SPECTRUSMINE': 21, 'WHEATFARM': 22, 'RAWPOTATOFARM': 23, 'RICEFARM': 24, 'FISHINGSPOT': 25
  };

  enemySpawnInterval = 4500;
  lastEnemySpawnTime = 0;
  maxEnemyCount = 25;

  tileMap: Phaser.Tilemaps.Tilemap;
  mapLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  resourceLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  buildingLayer: Phaser.Tilemaps.DynamicTilemapLayer;

  mapIslands: TileIsland[] = [];

  resourceAnimationGroup: Phaser.GameObjects.Group;
  minimapIconGroup: Phaser.GameObjects.Group;
  fighterGroup: Phaser.GameObjects.Group;
  projectileGroup: Phaser.GameObjects.Group;
  pathfindingTestGroup: Phaser.GameObjects.Group;

  cameraControls: Phaser.Cameras.Controls.SmoothedKeyControl;
  minimapPanBox: Phaser.GameObjects.Rectangle;

  mainCamera: Phaser.Cameras.Scene2D.Camera;
  minimapCamera: Phaser.Cameras.Scene2D.Camera;
  minimapSize = 500;

  isDraggingScreen: boolean;

  pointerTileX: number;
  pointerTileY: number;
  dragStartPoint: Phaser.Math.Vector2;

  constructor(protected resourcesService: ResourcesService,
              protected fightersService: FighterService,
              protected enemyService: EnemyService,
              protected storeService: StoreService,
              protected buildingsService: BuildingsService,
              protected messagesService: MessagesService) {
    this.seedRng(Math.random());

    for (const tileTypeString in MapTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = MapTileType[tileTypeString];
        this.mapTileData.set(tileType, baseTiles.mapTiles[tileType]);
      }
    }

    for (const tileTypeString in BuildingTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = BuildingTileType[tileTypeString];
        this.buildingTileData.set(tileType, baseTiles.buildingTiles[tileType]);
      }
    }

    for (const tileTypeString in ResourceTileType) {
      if (typeof tileTypeString === 'string') {
        const tileType = ResourceTileType[tileTypeString];
        this.resourceTileData.set(tileType, baseTiles.resourceTiles[tileType]);
      }
    }

    this.mapManager = new Phaser.Game({
      width: 1920, height: 1080, zoom: 1, parent: 'map-canvas-container',
      scene: {
        preload: _ => this.preloadMap(),
        create:  _ => this.createMap(),
        update:  (time, delta) => this.updateMap(time, delta)
      },
      physics: {
        default: 'arcade'
      }
    });
  }

  preloadMap() {
    this.canvasContainer = this.mapManager.canvas.parentElement;
    this.resize();

    this.scene.load.image('map', '../../../assets/sprites/map.png');
    this.scene.load.image('buildings', '../../../assets/sprites/buildings.png');
    this.scene.load.image('resourceSpawns', '../../../assets/sprites/resourceSpawns.png');

    this.scene.load.spritesheet('buildingSprites', '../../../assets/sprites/buildings.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.scene.load.spritesheet('resources', '../../../assets/sprites/resources.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.scene.load.spritesheet('sentry', '../../../assets/sprites/sentry.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.scene.load.spritesheet('enemy', '../../../assets/sprites/enemy.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.scene.load.spritesheet('arrow', '../../../assets/sprites/arrow.png', {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  createMap() {
    this.tileMap = this.scene.make.tilemap({
      tileWidth: 48, tileHeight: 48,
      width: this.totalChunkX * this.chunkWidth,
      height: this.totalChunkY * this.chunkHeight
    });

    this.mainCamera = this.scene.cameras.main;

    this.resourceAnimationGroup = this.scene.add.group();
    this.minimapIconGroup = this.scene.add.group();
    this.fighterGroup = this.scene.add.group();
    this.enemyGroup = this.scene.add.group();
    this.projectileGroup = this.scene.add.group();
    this.pathfindingTestGroup = this.scene.add.group();

    this.scene.physics.add.collider(this.projectileGroup, this.enemyGroup, this.projectileCollide);

    this.initializeMap();

    const cursors = this.scene.input.keyboard.createCursorKeys();
    const zoomKeys = this.scene.input.keyboard.addKeys('page_up,page_down');

    const controlConfig = {
      camera: this.mainCamera,
      up: cursors.up,
      down: cursors.down,
      left: cursors.left,
      right: cursors.right,
      zoomIn: zoomKeys['page_down'],
      zoomOut: zoomKeys['page_up'],
      zoomSpeed: 0.03,
      acceleration: 0.8,
      drag: 0.1,
      maxSpeed: 5
    };

    this.cameraControls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

    const xMax = this.mapLayer.tileToWorldX(this.totalChunkX * this.chunkWidth);
    const yMax = this.mapLayer.tileToWorldY(this.totalChunkY * this.chunkHeight);
    this.mainCamera.setBounds(0, 0, xMax, yMax, false).setName('main');

    this.minimapCamera = this.scene.cameras.add(this.mainCamera.width - this.minimapSize, 0,
      this.minimapSize, this.minimapSize, false, 'mini');
    this.minimapCamera.zoom = this.minimapSize / xMax;
    this.minimapCamera.scrollX = xMax / 2 - this.minimapSize / 2;
    this.minimapCamera.scrollY = yMax / 2 - this.minimapSize / 2;

    this.minimapPanBox = this.scene.add.rectangle(this.mainCamera.scrollX, this.mainCamera.scrollY,
      this.mainCamera.width, this.mainCamera.height, 0x882277, 0.75);
    this.mainCamera.ignore(this.minimapPanBox);

    this.mainCamera.on('mousedown', _ => this.clickMap());
    this.minimapCamera.on('mousedown', _ => this.clickMinimap());

    this.scene.tweens.add({
      targets: this.tileMap,
      x: 100,
      ease: 'Sine.easeInOut',
      yoyo: false,
      repeat: -1,
      duration: 3000
    });

    this.mainCamera.fadeIn(750);
    this.minimapCamera.fadeIn(750);

    // debug only
    this.resourcesService.highestTierReached = 10;
    this.resourcesService.getResources().map(resource => resource.amount = 5000);
    this.enemyService.enemiesActive = true;

    this.canvasContainer.onmousewheel = event => this.zoomMap(event);
  }

  updateMap(elapsed, deltaTime) {
    this.resize();

    this.cameraControls.update(deltaTime);

    const pointer = this.scene.input.activePointer;

    const cursorWorldPoint = pointer.positionToCamera(this.mainCamera) as Phaser.Math.Vector2;

    this.pointerTileX = this.mapLayer.worldToTileX(cursorWorldPoint.x);
    this.pointerTileY = this.mapLayer.worldToTileY(cursorWorldPoint.y);

    this.minimapPanBox.x = this.mainCamera.worldView.x + this.mainCamera.width / 2;
    this.minimapPanBox.y = this.mainCamera.worldView.y + this.mainCamera.height / 2;
    this.minimapPanBox.width = this.mainCamera.worldView.width;
    this.minimapPanBox.height = this.mainCamera.worldView.height;
    this.minimapPanBox.depth = 2;

    const camerasBelowCursor = this.scene.cameras.getCamerasBelowPointer(pointer);

    if (camerasBelowCursor.includes(this.minimapCamera)) {
      this.clickMinimap();
    } else {
      this.clickMap();
    }

    // Updating tilemap GameObjects

    if (!this.mapLayer) {
      return;
    }

    const resourceAnimations = this.resourceAnimationGroup.children.entries.map(anim => anim as ResourceAnimation);

    for (const resourceAnimation of resourceAnimations) {
      if (resourceAnimation.pathingDone) {
        resourceAnimation.finishAnimation();
        this.resourceAnimationGroup.remove(resourceAnimation);
      }
    }

    for (const tile of this.mapLayer.filterTiles(_tile => _tile.properties['buildingNode'] && _tile.properties['buildingNode'].market)) {
      tile.properties['buildingNode'].market.tick(elapsed, deltaTime);
    }

    if (this.enemyService.enemiesActive && elapsed - this.lastEnemySpawnTime >= this.enemySpawnInterval
        && this.enemyGroup.countActive() < this.maxEnemyCount) {
      const tile = this.getRandomTile([MapTileType.Grass], true);
      this.spawnEnemy(this.enemyService.enemyTypes[0], tile);

      this.lastEnemySpawnTime = elapsed;
    }

    for (const enemy of this.enemyGroup.getChildren().filter(_enemy => _enemy.active)) {
      (enemy as Enemy).tick(elapsed, deltaTime);
    }

    for (const fighter of this.fighterGroup.getChildren().filter(_fighter => _fighter.active)) {
      (fighter as Fighter).tick(elapsed, deltaTime);
    }

    for (const projectile of this.projectileGroup.getChildren().filter(_projectile => _projectile.active)) {
      (projectile as Projectile).tick(elapsed, deltaTime);
    }

    // this.projectiles = this.projectiles.filter(projectile => !projectile.hitTarget);
  }

  resize() {
    this.mapManager.resize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
    this.scene.cameras.resize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);

    if (this.minimapCamera) {
      this.minimapCamera.setViewport(this.canvasContainer.clientWidth - this.minimapSize, 0, this.minimapSize, this.minimapSize);
    }
  }

  clickMap() {
    const pointer = this.scene.input.activePointer;

    if (pointer.justDown) {
      this.isDraggingScreen = false;

      this.dragStartPoint = new Phaser.Math.Vector2(pointer.position.x + this.mainCamera.scrollX,
                                                    pointer.position.y + this.mainCamera.scrollY);

    } else if (pointer.isDown) {
      if (!pointer.primaryDown) {
        const cursorScreenPoint = this.scene.input.activePointer.position;

        this.mainCamera.scrollX = this.dragStartPoint.x - cursorScreenPoint.x;
        this.mainCamera.scrollY = this.dragStartPoint.y - cursorScreenPoint.y;
      }

      if (Math.abs(pointer.x - pointer.downX) >= 5 || Math.abs(pointer.y - pointer.downY) >= 5) {
        this.isDraggingScreen = true;
      }

      if (pointer.primaryDown && this.cursorTool === CursorTool.PlaceBuildings) {
        this.createBuilding(this.pointerTileX, this.pointerTileY, this.buildingsService.selectedBuilding, true, 50);
      } else if (pointer.primaryDown && this.cursorTool === CursorTool.ClearBuildings) {
        this.clearBuilding(this.pointerTileX, this.pointerTileY);
      }
    } else if (pointer.justUp && !this.isDraggingScreen) {
      switch (this.cursorTool) {
        case CursorTool.PlaceBuildings: {
          this.createBuilding(this.pointerTileX, this.pointerTileY, this.buildingsService.selectedBuilding, true, 50);

          break;
        } case CursorTool.TileDetail: {
          const tile = this.getMapTile(this.pointerTileX, this.pointerTileY);
          if (tile.properties['resourceNode'] || tile.properties['buildingNode']) {
            this.focusedTile = tile;
          }

          break;
        } case CursorTool.PlaceFighters: {
          this.spawnFighter(this.fightersService.selectedFighterType, this.pointerTileX, this.pointerTileY);

          break;
        } case CursorTool.PathfindingTest: {
          this.pathfindingTestGroup.clear(false, true);

          const tile = this.getMapTile(this.pointerTileX, this.pointerTileY);
          const homeTile = this.mapLayer.findTile(_tile => _tile.properties['buildingNode'] &&
            _tile.properties['buildingNode'].tileType === BuildingTileType.Home);

          this.findPath(tile, homeTile, false, true).subscribe(tilePath => {
            for (const pathTile of tilePath) {
              let tileColor = 0x0000ff;
              if (tilePath.indexOf(pathTile) === 0) {
                tileColor = 0x00ff00;
              } else if (tilePath.indexOf(pathTile) === tilePath.length - 1) {
                tileColor = 0xff0000;
              }

              const tileHighlight = this.scene.add.rectangle(pathTile.getCenterX(), pathTile.getCenterY(),
                pathTile.width, pathTile.width, tileColor, 0.5);
              tileHighlight.setDepth(3);
              this.pathfindingTestGroup.add(tileHighlight);
            }
          });
        }
      }
    }
  }

  clickMinimap() {
    const pointer = this.scene.input.activePointer;
    const cursorWorldPoint = pointer.positionToCamera(this.minimapCamera) as Phaser.Math.Vector2;

    if (pointer.primaryDown) {
      this.mainCamera.centerOn(cursorWorldPoint.x, cursorWorldPoint.y);
    }
  }

  zoomMap(event) {
    let newScale = this.scene.cameras.main.zoom - event.deltaY / 65 / this.scene.cameras.main.zoom;

    if (newScale < 0.5) {
      newScale = 0.5;
    } else if (newScale > 4) {
      newScale = 4;
    }

    this.scene.cameras.main.zoomTo(newScale, 50);
  }

  seedRng(seed: number) {
    this.prngSeed = seed;
    this.rng = prng.create(seed);

    this.mapSeed = this.rng.nextInt();
    this.resourceSeed = this.rng.nextInt();
  }

  initializeMap() {
    this.tileMap.removeAllLayers();

    this.resourceAnimationGroup.clear(true);
    this.minimapIconGroup.clear(true);
    this.fighterGroup.clear(true);
    this.enemyGroup.clear(true);
    this.projectileGroup.clear(true);
    this.pathfindingTestGroup.clear(true);

    this.mapIslands = [];

    const mapTileset = this.tileMap.addTilesetImage('map', 'map', 48, 48);
    const resourceTileset = this.tileMap.addTilesetImage('resourceSpawns', 'resourceSpawns', 48, 48);
    const buildingTileset = this.tileMap.addTilesetImage('buildings', 'buildings', 48, 48);

    this.mapLayer = this.tileMap.createBlankDynamicLayer('mapLayer', mapTileset);
    this.resourceLayer = this.tileMap.createBlankDynamicLayer('resourceLayer', resourceTileset);
    this.buildingLayer = this.tileMap.createBlankDynamicLayer('buildingLayer', buildingTileset);

    for (let y = 0; y < this.totalChunkY; y++) {
      for (let x = 0; x < this.totalChunkX; x++) {
        this.generateChunk(x, y);
      }
    }

    // Parse out island structure
    const visitedTileIds: number[] = [];
    for (const tile of this.mapLayer.filterTiles(_tile => _tile.properties['tileType'] !== MapTileType.Water)) {
      if (visitedTileIds.includes(tile.properties['id'])) {
        continue;
      }

      visitedTileIds.push(tile.properties['id']);

      const islandId = this.mapIslands.length;
      tile.properties['islandId'] = islandId;
      this.mapIslands[islandId] = {tiles: [{x: tile.x, y: tile.y}]};

      const neighbors = this.getNeighborTiles(tile).filter(neighbor => neighbor.properties['tileType'] !== MapTileType.Water);
      while (neighbors.length) {
        const currentNeighbor = neighbors.pop();
        visitedTileIds.push(currentNeighbor.properties['id']);

        currentNeighbor.properties['islandId'] = islandId;
        this.mapIslands[islandId].tiles.push({x: currentNeighbor.x, y: currentNeighbor.y});

        for (const neighbor of this.getNeighborTiles(currentNeighbor)) {
          if (neighbor.properties['tileType'] !== MapTileType.Water && !visitedTileIds.includes(neighbor.properties['id'])) {
            neighbors.push(neighbor);
          }
        }
      }

      this.scene.add.text(tile.pixelX, tile.pixelY, islandId.toString(), {
        fontSize: 128,
        fill: 'black'
      });
    }

    // Placing home (unless one already exists)
    // We want to place the home closer to the center of the map.
    const homeTile = this.getRandomTile([MapTileType.Grass], true, this.totalChunkX * 0.4 * this.chunkWidth,
                                                                   this.totalChunkX * 0.6 * this.chunkWidth,
                                                                   this.totalChunkY * 0.4 * this.chunkHeight,
                                                                   this.totalChunkY * 0.6 * this.chunkHeight);
    const homeData = this.buildingTileData.get(BuildingTileType.Home);
    this.createBuilding(homeTile.x, homeTile.y, homeData, false, 50, true);

    this.mainCamera.centerOn(homeTile.pixelX, homeTile.pixelY);

    const minimapHomeIcon = this.scene.add.sprite(homeTile.pixelX, homeTile.pixelY,
      'buildingSprites', this.tileIndices[BuildingTileType.Home]);
    minimapHomeIcon.scaleX = 10;
    minimapHomeIcon.scaleY = 10;
    minimapHomeIcon.depth = 1;
    this.minimapIconGroup.add(minimapHomeIcon);
    this.mainCamera.ignore(minimapHomeIcon);

    // Placing an oak tree & stone mine near the home, to ensure they're always available.
    // We want to vary up their positions a bit to feel more natural.
    let grassTiles: Phaser.Tilemaps.Tile[] = [], mountainTiles: Phaser.Tilemaps.Tile[] = [];
    const placedRoads: Phaser.Tilemaps.Tile[] = [];

    let oakTile: Phaser.Tilemaps.Tile, stoneTile: Phaser.Tilemaps.Tile;
    let currentTile = homeTile;

    for (let i = 0; i < this.rng.nextIntRange(7, 16); i++) {
      let neighbors = this.getNeighborTiles(currentTile);

      const existingOakTile = neighbors.find(tile => tile.properties['resourceNode'] &&
        tile.properties['resourceNode'].tileType === ResourceTileType.OakTree);
      if (existingOakTile) {
        oakTile = existingOakTile;
      }

      const existingStoneTile = neighbors.find(tile => tile.properties['resourceNode'] &&
        tile.properties['resourceNode'].tileType === ResourceTileType.StoneMine);
      if (existingStoneTile) {
        stoneTile = existingStoneTile;
      }

      grassTiles = grassTiles.concat(neighbors.filter(tile => tile.properties['tileType'] === MapTileType.Grass));
      mountainTiles = mountainTiles.concat(neighbors.filter(tile => tile.properties['tileType'] === MapTileType.Mountain));

      neighbors = neighbors.filter(
        tile => !tile.properties['buildingNode'] && !tile.properties['resourceNode'] && tile.properties['tileType'] === MapTileType.Grass);

      if (!neighbors.length) {
        currentTile = grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
      } else {
        currentTile = neighbors[this.rng.nextIntRange(0, neighbors.length - 1)];
      }
      const roadData = this.buildingTileData.get(BuildingTileType.Road);
      this.createBuilding(currentTile.x, currentTile.y, roadData, false, 50, true);
      placedRoads.push(currentTile);
    }

    grassTiles = grassTiles.filter(tile => !tile.properties['buildingNode'] && !tile.properties['resourceNode']);
    mountainTiles = mountainTiles.filter(tile => !tile.properties['buildingNode'] && !tile.properties['resourceNode']);

    if (!oakTile) {
      oakTile = grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
      grassTiles = grassTiles.filter(tile => tile !== oakTile);
    }

    if (!stoneTile) {
      stoneTile = mountainTiles.length ? mountainTiles[this.rng.nextIntRange(0, mountainTiles.length - 1)] :
                                            grassTiles[this.rng.nextIntRange(0, grassTiles.length - 1)];
    }

    this.setResourceTile(oakTile.x, oakTile.y, ResourceTileType.OakTree, 50);
    this.setResourceTile(stoneTile.x, stoneTile.y, ResourceTileType.StoneMine, 50);

    this.updatePaths(homeTile, true);

    for (const roadTile of placedRoads) {
      if (!oakTile.properties['resourceNode'].path.includes(roadTile) && !stoneTile.properties['resourceNode'].path.includes(roadTile)) {
        this.clearBuildingTile(roadTile.x, roadTile.y);
      }
    }

    // Final sweep to make sure all spawnable resources exist at least once.
    let naturalResources = Array.from(this.resourceTileData.values());
    naturalResources = naturalResources.filter(resource => resource.isNaturalResource);
    naturalResources = naturalResources.filter(resource =>
      !this.resourceLayer.findTile(tile => tile.properties['tileType'] === resource.tileType));

    for (const missingResource of naturalResources) {
      const resourceTile = this.getRandomTile(missingResource.spawnsOn, true);
      this.setResourceTile(resourceTile.x, resourceTile.y, missingResource.tileType, 50);
    }
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
        const tileType = this.getBiome(noiseValue);

        const tile = this.mapLayer.putTileAt(this.tileIndices[tileType], x, y);
        tile.properties['id'] = tileId;
        tile.properties['height'] = noiseValue;
        tile.properties['tileType'] = tileType;
      }
    }

    const centerVector = new Phaser.Math.Vector2(this.totalChunkX * this.chunkWidth * this.tilePixelSize / 2,
      this.totalChunkY * this.chunkHeight * this.tilePixelSize / 2);
    const maxTier = Math.max(...this.resourcesService.getResources().map(resource => resource.resourceTier));
    const tierRingSize = centerVector.length() / maxTier;

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
            const neighborTile = this.getMapTile(nx, ny);
            if (neighborTile && neighborTile.properties['height'] > maxNoise) {
              maxNoise = neighborTile.properties['height'];
            }
          }
        }

        const tile = this.getMapTile(x, y);
        if (tile.properties['height'] === maxNoise) {
          const distanceToCenter = new Phaser.Math.Vector2(Math.abs(tile.x - centerVector.x),
                                                           Math.abs(tile.y - centerVector.y)).length();
          const tierValue = Math.floor(distanceToCenter / tierRingSize);

          let naturalResources = Array.from(this.resourceTileData.values());
          naturalResources = naturalResources.filter(resource => resource.spawnsOn.includes(tile.properties['tileType']));
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
              this.setResourceTile(tile.x, tile.y, resource.tileType, 50);
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
        this.clearLayeredTile(x, y);
      }
    }
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

  updatePaths(updatedTile: Phaser.Tilemaps.Tile, onlyPathable: boolean) {
    const visitedTiles: Phaser.Tilemaps.Tile[] = [];
    const tileQueue: Phaser.Tilemaps.Tile[] = [];
    let currentTile: Phaser.Tilemaps.Tile;

    tileQueue.push(updatedTile);

    const homeTile = this.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);

    while (tileQueue.length) {
      currentTile = tileQueue.pop();

      const neighborTiles = this.getNeighborTiles(currentTile);
      visitedTiles.push(currentTile);

      for (const neighbor of neighborTiles) {
        let buildingTile: BuildingTileData;
        if (neighbor.properties['buildingNode']) {
          buildingTile = this.buildingTileData.get(neighbor.properties['buildingNode'].tileType);
        }

        if (!visitedTiles.includes(neighbor) &&
            (!onlyPathable || ((buildingTile && buildingTile.resourcePathable)) || neighbor.properties['resourceNode'])) {
          tileQueue.push(neighbor);
        }
      }

      if (!currentTile.properties['resourceNode']) {
        continue;
      }

      this.findPath(currentTile, homeTile, true, true).subscribe(tilePath => {
        const resourceNode: ResourceNode = currentTile.properties['resourceNode'];
        resourceNode.path = tilePath;

        const pathAvailable = resourceNode.path.length &&
          !resourceNode.path.some(tile => tile.properties['buildingNode'] && tile.properties['buildingNode'].health <= 0);
        const resources = this.resourceTileData.get(resourceNode.tileType).resourceEnums
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

    const homeTile = this.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);

    for (const resourceTile of resourceTiles) {
      this.findPath(resourceTile, homeTile, true, true).subscribe(tilePath => {
        const resourceNode = resourceTile.properties['resourceNode'];
        resourceNode.path = tilePath;

        if (resourceNode.path.length && !resourceNode.path.some(tile => tile.health <= 0)) {
          const resources = this.resourceTileData.get(resourceNode.tileType).resourceEnums
            .map(resourceEnum => this.resourcesService.resources.get(resourceEnum));
          for (const resource of resources) {
            resource.pathAvailable = true;
          }
        }
      });
    }

    for (const marketTile of this.mapLayer.getTilesWithin()) {
      const buildingNode: BuildingNode = marketTile.properties['buildingNode'];
      if (buildingNode && buildingNode.market) {
        buildingNode.market.calculateConnection();
      }
    }
  }

  findPath(startTile: Phaser.Tilemaps.Tile, targetTile: Phaser.Tilemaps.Tile, onlyPathable: boolean, onlyWalkable: boolean,
      maxAttempts: number = Infinity): Observable<Phaser.Tilemaps.Tile[]> {
    const visitedTiles: Phaser.Tilemaps.Tile[] = [];

    let tileQueue: Phaser.Tilemaps.Tile[] = [];

    const tileDistances = [];
    const tileHeuristicDistances = [];

    const nodeMap = new Map<Phaser.Tilemaps.Tile, Phaser.Tilemaps.Tile>();

    const targetPosition = new Phaser.Math.Vector2(targetTile.x, targetTile.y);

    let currentNode: Phaser.Tilemaps.Tile;

    tileDistances[startTile.properties['id']] = 0;

    tileQueue.push(startTile);

    let nodesProcessed = 0;

    while (tileQueue.length) {
      nodesProcessed++;
      if (nodesProcessed > maxAttempts) {
        break;
      }

      tileQueue = tileQueue.sort((a, b) => tileHeuristicDistances[b.properties['id']] - tileHeuristicDistances[a.properties['id']]);
      currentNode = tileQueue.pop();

      if (currentNode === targetTile) {
        const buildingPath: Phaser.Tilemaps.Tile[] = [];

        let backtrackNode = currentNode;
        while (backtrackNode !== startTile) {
          buildingPath.push(backtrackNode);
          backtrackNode = nodeMap.get(backtrackNode);
        }

        buildingPath.push(backtrackNode);

        return of(buildingPath.reverse());
      }

      const neighborDistance = tileDistances[currentNode.properties['id']] + 1;

      for (const neighbor of this.getNeighborTiles(currentNode)) {
        const tileType: MapTileType = neighbor.properties['tileType'];
        const buildingNode: BuildingNode = neighbor.properties['buildingNode'];
        const resourceNode: ResourceNode = neighbor.properties['resourceNode'];
        const buildingData: BuildingTileData = buildingNode ? this.buildingTileData.get(buildingNode.tileType) : null;

        const pathable = buildingData && buildingData.resourcePathable;
        const walkable = !resourceNode && (!buildingData || buildingData.subType !== BuildingSubType.Obstacle) &&
          (this.mapTileData.get(tileType).walkable || pathable);

        if (!tileDistances[neighbor.properties['id']]) {
          tileDistances[neighbor.properties['id']] = Infinity;
          tileHeuristicDistances[neighbor.properties['id']] = Infinity;
        }

        if (!visitedTiles.includes(neighbor) && (!onlyPathable || pathable) && (!onlyWalkable || walkable) &&
            tileDistances[neighbor.properties['id']] > neighborDistance) {
          nodeMap.set(neighbor, currentNode);

          tileDistances[neighbor.properties['id']] = neighborDistance;

          const neighborPosition = new Phaser.Math.Vector2(neighbor.x, neighbor.y);
          tileHeuristicDistances[neighbor.properties['id']] = neighborDistance + targetPosition.distance(neighborPosition);

          tileQueue.push(neighbor);
        }
      }

      visitedTiles.push(currentNode);
    }

    return of([]);
  }

  spawnHarvestedResourceAnimation(resource: Resource, multiplier: number = 1, spawnedByPlayer: boolean) {
    const matchingTiles = this.getResourceTiles(resource.resourceEnum).filter(_tile => _tile.properties['resourceNode'].path.length);

    if (!resource.canAfford(multiplier)) {
      return;
    }

    resource.deductResourceConsumes(multiplier);

    const tile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
    if (tile === undefined) {
      return;
    }

    const tilePath: Phaser.Tilemaps.Tile[] = tile.properties['resourceNode'].path;

    const animationType = spawnedByPlayer ? ResourceAnimationType.PlayerSpawned : ResourceAnimationType.WorkerSpawned;

    this.spawnResourceAnimation(resource.resourceEnum, multiplier, animationType, tile, tilePath, spawnedByPlayer);
  }

  spawnSoldResourceAnimation(resourceEnum: ResourceEnum, multiplier: number, market: Market) {
    this.spawnResourceAnimation(resourceEnum, multiplier, ResourceAnimationType.Sold, market.homeTile, market.tilePath, false, market);
  }

  spawnResourceAnimation(resourceEnum: ResourceEnum, multiplier: number, animationType: ResourceAnimationType,
                         startTile: Phaser.Tilemaps.Tile, tilePath: Phaser.Tilemaps.Tile[], spawnedByPlayer: boolean, market?: Market) {
    const worldX = this.mapLayer.tileToWorldX(startTile.x) + startTile.width / 4;
    const worldY = this.mapLayer.tileToWorldY(startTile.y) + startTile.height / 4;

    const path = this.tilesToLinearPath(tilePath);

    const resourceSpriteIndex = this.tileIndices[resourceEnum];

    const resourceAnimation = new ResourceAnimation(worldX, worldY, startTile,
      this.resourceAnimationSpeed, path, animationType, resourceEnum, multiplier, spawnedByPlayer,
      this.scene, 'resources', resourceSpriteIndex, this.resourcesService, this.storeService);

    resourceAnimation.setScale(2 / 3, 2 / 3);

    this.scene.tweens.add({
      targets: resourceAnimation,
      angle: 30,
      ease: 'Sine.easeInOut',
      duration: 750,
      repeat: -1,
      yoyo: true
    });

    this.resourceAnimationGroup.add(resourceAnimation, true);
  }

  spawnProjectile(owner: Actor, target: Actor) {
    const projectile = new Projectile('Arrow', owner.x, owner.y,
      owner.currentTile, this.projectileAnimationSpeed, owner, target,
      this.scene, 'arrow', 0);

    this.scene.physics.add.existing(projectile);
    this.projectileGroup.add(projectile, true);
    projectile.fireProjectile();
  }

  projectileCollide(projectile: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    (enemy as Enemy).takeDamage((projectile as Projectile));
    projectile.destroy();
  }

  spawnFighter(fighterType: FighterData, tileX: number, tileY: number) {
    if (!this.fightersService.canAffordFighter(fighterType)) {
      return;
    }

    this.fightersService.purchaseFigher(fighterType);

    const spawnTile = this.mapLayer.getTileAt(tileX, tileY);

    const fighter = new Fighter(fighterType.name, spawnTile.getCenterX(), spawnTile.getCenterY(), spawnTile, fighterType.maxHealth, 1,
      fighterType.attack, fighterType.defense, fighterType.attackRange, fighterType.description, fighterType.cost, fighterType.movable,
      1000, this.scene, 'sentry', 0, this.resourcesService, this.enemyService, this);
    this.fighterGroup.add(fighter, true);
  }

  spawnEnemy(enemyType: EnemyData, tile: Phaser.Tilemaps.Tile) {
    if (this.enemyGroup.countActive() > this.maxEnemyCount) {
      return;
    }

    const cappedScore = Math.min(3000, this.resourcesService.playerScore / 50000);
    const difficultyModifier = Math.max(1, Math.random() * cappedScore);

    const animationSpeed = this.enemyAnimationSpeed * Math.min(4, 1 + difficultyModifier / 10000);

    const enemy = new Enemy(enemyType.name, tile.getCenterX(), tile.getCenterY(), tile, enemyType.maxHealth * difficultyModifier,
      animationSpeed, enemyType.attack * difficultyModifier, enemyType.defense * difficultyModifier, enemyType.attackRange,
      enemyType.targetableBuildingTypes, enemyType.resourcesToSteal, enemyType.stealMax * difficultyModifier,
      enemyType.resourceCapacity * difficultyModifier, this.scene, 'enemy', 0, this, this.resourcesService, this.messagesService);

    this.scene.physics.add.existing(enemy);
    this.enemyGroup.add(enemy, true);
    (enemy.body as Phaser.Physics.Arcade.Body).moves = false;
  }

  getRandomTile(mapTileTypes?: MapTileType[], avoidResources = false,
      minX = 0, maxX = Infinity, minY = 0, maxY = Infinity): Phaser.Tilemaps.Tile {
    const tiles = this.mapLayer.getTilesWithin(minX, minY, maxX - minX, maxY - minY);
    let tile: Phaser.Tilemaps.Tile;

    do {
      tile = tiles[Math.floor(this.rng.nextDouble() * tiles.length)];
    } while (!tile || !(!mapTileTypes || mapTileTypes.includes(tile.properties['tileType'])) ||
      (avoidResources && tile.properties['resourceNode']));

    return tile;
  }

  getRandomIslandId(minimumSize = 1): number {
    const islands = this.mapIslands.filter(island => island.tiles.length >= minimumSize);
    const selectedIsland = islands[Math.floor(Math.random() * islands.length)];

    return this.mapIslands.indexOf(selectedIsland);
  }

  getRandomTileOnIsland(islandId: number, mapTileTypes?: MapTileType[], avoidResources = false): Phaser.Tilemaps.Tile {
    let islandTiles = this.mapIslands[islandId].tiles.map(tile => this.mapLayer.getTileAt(tile.x, tile.y));

    if (mapTileTypes) {
      islandTiles = islandTiles.filter(tile => mapTileTypes.includes(tile.properties['tileType']));
    }

    if (avoidResources) {
      islandTiles = islandTiles.filter(tile => tile.properties['resourceNode']);
    }

    return islandTiles[Math.floor(Math.random() * islandTiles.length)];
  }

  tilesToLinearPath(tiles: Phaser.Tilemaps.Tile[]): Phaser.Curves.Path {
    if (!tiles.length) {
      return null;
    }

    const pathPoints = tiles.map(tile => new Phaser.Math.Vector2(this.mapLayer.tileToWorldX(tile.x) + tile.width / 4,
    this.mapLayer.tileToWorldY(tile.y) + tile.height / 4));

    const startTile = tiles[0];
    const worldX = this.mapLayer.tileToWorldX(startTile.x) + startTile.width / 4;
    const worldY = this.mapLayer.tileToWorldY(startTile.y) + startTile.height / 4;

    const path = new Phaser.Curves.Path(worldX, worldY);
    for (const pathPoint of pathPoints) {
      path.lineTo(pathPoint);
    }

    return path;
  }

  createBuilding(x: number, y: number, buildingData: BuildingTileData, removable: boolean, health: number, createForFree = false) {
    if (!buildingData) {
      return;
    }

    const buildingExists = this.buildingLayer.getTileAt(x, y) != null;
    const resourceExists = this.resourceLayer.getTileAt(x, y) != null;

    const mapTile = this.mapLayer.getTileAt(x, y);
    const canPlaceHere = buildingData.buildableSurfaces.includes(mapTile.properties['tileType']);

    if (buildingExists || resourceExists || !canPlaceHere || !(createForFree || this.buildingsService.canAffordBuilding(buildingData))) {
      return;
    }

    if (!createForFree) {
      this.buildingsService.purchaseBuilding(buildingData);
    }

    const buildingTile = this.setBuildingTile(x, y, buildingData.tileType, removable, health);

    if (buildingData.placesResourceTile) {
      this.setResourceTile(x, y, buildingData.resourceTileType, health);
    }

    if (buildingData.subType === BuildingSubType.Market) {
      let resourceType: ResourceType;
      switch (buildingData.tileType) {
        case BuildingTileType.WoodMarket: {
          resourceType = ResourceType.Wood;
          break;
        } case BuildingTileType.MineralMarket: {
          resourceType = ResourceType.Mineral;
          break;
        } case BuildingTileType.MetalMarket: {
          resourceType = ResourceType.Metal;
          break;
        }
      }

      mapTile.properties['buildingNode'].market = new Market(this, this.resourcesService, resourceType, mapTile, true);
    }

    this.updatePaths(buildingTile, true);
  }

  clearBuilding(x: number, y: number) {
    const buildingTile = this.mapLayer.getTileAt(x, y);
    if (!buildingTile || !buildingTile.properties['buildingNode'] || !buildingTile.properties['buildingNode'].removable) {
      return;
    }

    const buildingNode: BuildingNode = buildingTile.properties['buildingNode'];
    const buildingData = this.buildingTileData.get(buildingNode.tileType);

    this.buildingsService.refundBuilding(buildingData);

    this.clearBuildingTile(x, y);
    if (buildingData.placesResourceTile) {
      this.clearResourceTile(x, y);
    }

    this.updatePaths(buildingTile, true);
  }

  getNeighborTiles(tile: Phaser.Tilemaps.Tile): Phaser.Tilemaps.Tile[] {
    const neighborPositions = [
      {x: tile.x - 1, y: tile.y},
      {x: tile.x + 1, y: tile.y},
      {x: tile.x, y: tile.y - 1},
      {x: tile.x, y: tile.y + 1}
    ];

    const tiles: Phaser.Tilemaps.Tile[] = [];
    for (const position of neighborPositions) {
      if (position.x >= 0 && position.x < this.totalChunkX * this.chunkWidth &&
          position.y >= 0 && position.y < this.totalChunkY * this.chunkHeight) {
        tiles.push(this.getMapTile(position.x, position.y));
      }
    }

    return tiles;
  }

  getChunkOffset(x: number, y: number) {
    const chunkIndex = Math.floor(x / this.chunkWidth) + this.totalChunkX * Math.floor(y / this.chunkHeight);
    return chunkIndex * this.chunkWidth * this.chunkHeight;
  }

  getMapTile(x: number, y: number): Phaser.Tilemaps.Tile {
    return this.mapLayer.getTileAt(x, y);
  }

  setMapTile(x: number, y: number, tile: Phaser.Tilemaps.Tile) {
    this.mapLayer.putTileAt(tile, x, y);
  }

  clearMapTile(x: number, y: number) {
    this.mapLayer.removeTileAt(x, y);
  }

  setBuildingTile(x: number, y: number, tileType: BuildingTileType, removable: boolean, health: number): Phaser.Tilemaps.Tile {
    this.buildingLayer.putTileAt(this.tileIndices[tileType], x, y);

    const mapTile = this.mapLayer.getTileAt(x, y);
    mapTile.properties['buildingNode'] = new BuildingNode(tileType, removable, health, this.resourcesService);

    return this.buildingLayer.getTileAt(x, y);
  }

  clearBuildingTile(x: number, y: number) {
    this.buildingLayer.removeTileAt(x, y);

    const mapTile = this.mapLayer.getTileAt(x, y);
    mapTile.properties['buildingNode'] = null;
  }

  setResourceTile(x: number, y: number, tileType: ResourceTileType, health: number): Phaser.Tilemaps.Tile {
    this.resourceLayer.putTileAt(this.tileIndices[tileType], x, y);

    const mapTile = this.mapLayer.getTileAt(x, y);
    mapTile.properties['resourceNode'] = new ResourceNode(tileType, health);

    return this.resourceLayer.getTileAt(x, y);
  }

  clearResourceTile(x: number, y: number) {
    this.resourceLayer.removeTileAt(x, y);

    const mapTile = this.mapLayer.getTileAt(x, y);
    mapTile.properties['resourceNode'] = null;
  }

  clearLayeredTile(x: number, y: number) {
    this.clearMapTile(x, y);
    this.clearBuildingTile(x, y);
    this.clearResourceTile(x, y);
  }

  clampTileCoordinates(x: number, y: number) {
    return [Math.floor(x / this.tilePixelSize), Math.floor(y / this.tilePixelSize)];
  }

  getResourceTiles(resourceEnum?: ResourceEnum): Phaser.Tilemaps.Tile[] {
    let tiles = this.mapLayer.filterTiles(tile => tile.properties['resourceNode']);

    if (resourceEnum) {
      const matchingTypes = Array.from(this.resourceTileData.values()).filter(
        tile => tile.resourceEnums.includes(resourceEnum)).map(tile => tile.tileType);
      tiles = tiles.filter(tile => matchingTypes.includes(tile.properties['resourceNode'].tileType));
    }

    return tiles;
  }

  get enemyGroup(): Phaser.GameObjects.Group {
    return this.enemyService.enemyGroup;
  }

  set enemyGroup(value: Phaser.GameObjects.Group) {
    this.enemyService.enemyGroup = value;
  }

  get scene(): Phaser.Scene {
    return this.mapManager.scene.scenes[0];
  }
}
