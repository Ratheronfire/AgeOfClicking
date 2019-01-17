import { LayerAutotiler } from './../objects/layerAutotiler';
import { Harvester } from './../objects/entity/unit/harvester';
import * as prng from 'prng-parkmiller-js';
import * as SimplexNoise from 'simplex-noise';
import { Actor } from '../objects/entity/actor';
import { Enemy, EnemyType } from '../objects/entity/enemy/enemy';
import { Raider } from '../objects/entity/enemy/raider';
import { Projectile } from '../objects/entity/projectile';
import { ResourceAnimation, ResourceAnimationType } from '../objects/entity/resourceAnimation';
import { Builder } from '../objects/entity/unit/builder';
import { Sentry } from '../objects/entity/unit/sentry';
import { Unit, UnitType } from '../objects/entity/unit/unit';
import { Resource } from '../objects/resource';
import { ResourceEnum, ResourceType } from '../objects/resourceData';
import { BuildingNode } from '../objects/tile/buildingNode';
import { Market } from '../objects/tile/market';
import { ResourceNode } from '../objects/tile/resourceNode';
import { BuildingSubType, BuildingTileData, MapTileData, MapTileType, ResourceTileData, ResourceTileType } from '../objects/tile/tile';
import { Vector } from '../objects/vector';
import { BuildingTileType } from './../objects/tile/tile';
import { GameService } from './game.service';
import { Merchant } from '../objects/entity/unit/merchant';

declare var require: any;
const baseTiles = require('../../assets/json/tileTypes.json');

export enum CursorTool {
  PlaceBuildings = 'PLACEBUILDINGS',
  ClearBuildings = 'CLEARBUILDINGS',
  TileDetail = 'TILEDETAIL',
  PlaceUnits = 'PLACEUNITS',
  UnitDetail = 'UNITDETAIL',
  PathfindingTest1 = 'PATHFINDINGTEST1',
  PathfindingTest2 = 'PATHFINDINGTEST2'
}

export enum MapLayerType {
  Ocean = 'OCEAN',
  Ground = 'GROUND',
  Mountain = 'MOUNTAIN',
  Buildings = 'BUILDINGS',
  Resources = 'RESOURCES'
}

interface TileCoordinate {
  x: number;
  y: number;
}

interface TileIsland {
  tiles: TileCoordinate[];
}

interface MapLayerContainer {
  layerType: MapLayerType;
  layer: Phaser.Tilemaps.DynamicTilemapLayer;
  autotiler: LayerAutotiler;
}

export class MapManager {
  public mapTileData: Map<string, MapTileData> = new Map<string, MapTileData>();
  public buildingTileData: Map<string, BuildingTileData> = new Map<string, BuildingTileData>();
  public resourceTileData: Map<string, ResourceTileData> = new Map<string, ResourceTileData>();

  mapManager: Phaser.Game;

  cursorTool: CursorTool;

  buildingListVisible = false;
  unitListVisible = false;

  focusedTile: Phaser.Tilemaps.Tile;
  focusedUnit: Unit;

  chunkWidth = 50;
  chunkHeight = 50;

  totalChunkX = 4;
  totalChunkY = 4;

  resourceAnimationSpeed = 5;
  actorAnimationSpeed = 0.005;
  projectileAnimationSpeed = 5;

  tilePixelSize = 48;

  // Map generation/rng variables

  rng: any;

  prngSeed: number;
  mapSeed: number;
  resourceSeed: number;

  mapCreated = false;

  // Phaser variables

  canvasContainer: HTMLElement;
  tileTooltip: HTMLElement;
  unitTooltip: HTMLElement;

  tileIndices = {
    'HOME': 0, 'WALL': 1, 'CRACKEDFORGE': 8, 'STONEFORGE': 9,
    'IRONFORGE': 10, 'GOLDFORGE': 11, 'LATINUMFORGE': 12, 'TEMPROUSDISTILLERY': 16, 'OAKOVEN': 17, 'STONEOVEN': 18, 'MARBLEOVEN': 19,
    'TEMPROUSOVEN': 20, 'CHICKENFARM': 24, 'COWFARM': 25, 'DRAGONFARM': 26, 'WOODMARKET': 2, 'MINERALMARKET': 3, 'METALMARKET': 4,
    'ENEMYPORTAL': 27, 'GOLD': 0, 'OAK': 1, 'EUCALYPTUS': 2, 'STONE': 3, 'COPPERORE': 4, 'IRONINGOT': 5, 'JELLYDONUT': 6, 'PINE': 7,
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

  enemySpawnInterval = 45000;
  lastEnemySpawnTime = 0;
  maxEnemyCount = 25;

  tileMap: Phaser.Tilemaps.Tilemap;
  mapLayerContainers: {[layerType: string]: MapLayerContainer} = {};

  mapIslands: TileIsland[] = [];

  resourceAnimationGroup: Phaser.GameObjects.Group;
  minimapIconGroup: Phaser.GameObjects.Group;
  projectileGroup: Phaser.GameObjects.Group;
  pathfindingTestGroup: Phaser.GameObjects.Group;

  unitAttackCircle: Phaser.GameObjects.Arc;
  unitPlaceCircle: Phaser.GameObjects.Arc;

  cameraControls: Phaser.Cameras.Controls.SmoothedKeyControl;
  minimapPanBox: Phaser.GameObjects.Rectangle;

  mainCamera: Phaser.Cameras.Scene2D.Camera;
  minimapCamera: Phaser.Cameras.Scene2D.Camera;
  minimapSize = 240;

  followingUnit = false;

  isDraggingScreen: boolean;

  pointerTileX: number;
  pointerTileY: number;
  dragStartPoint: Phaser.Math.Vector2;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

    this.mapLayerContainers[MapLayerType.Ocean] = {
      layerType: MapLayerType.Ocean,
      layer: null,
      autotiler: null
    };

    this.mapLayerContainers[MapLayerType.Ground] = {
      layerType: MapLayerType.Ground,
      layer: null,
      autotiler: null
    };

    this.mapLayerContainers[MapLayerType.Mountain] = {
      layerType: MapLayerType.Mountain,
      layer: null,
      autotiler: null
    };

    this.mapLayerContainers[MapLayerType.Buildings] = {
      layerType: MapLayerType.Buildings,
      layer: null,
      autotiler: null
    };

    this.mapLayerContainers[MapLayerType.Resources] = {
      layerType: MapLayerType.Resources,
      layer: null,
      autotiler: null
    };

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
      type: Phaser.AUTO, width: 1920, height: 1080, zoom: 1, parent: 'map-canvas-container',
      scene: {
        preload: _ => this.preloadMap(),
        create:  _ => { this.createMap(); },
        update:  (time, delta) => this.updateMap(time, delta)
      },
      physics: {
        default: 'arcade',
        debug: true
      }
    });
  }

  preloadMap() {
    this.canvasContainer = this.mapManager.canvas.parentElement;
    this.tileTooltip = document.getElementById('tile-tooltip');
    this.unitTooltip = document.getElementById('unit-tooltip');

    this.resize();

    // Tilesets
    this.scene.load.image('ocean', 'assets/sprites/water-export.png');
    this.scene.load.image('grass', 'assets/sprites/grass-export-extruded.png');
    this.scene.load.image('mountain', 'assets/sprites/mountain-export-extruded.png');
    this.scene.load.image('buildings', 'assets/sprites/buildings-export-extruded.png');
    this.scene.load.image('resourceSpawns', 'assets/sprites/resourceSpawns-extruded.png');

    this.scene.load.spritesheet('buildingSprites', 'assets/sprites/buildings-export-extruded.png',
      { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet('resources', 'assets/sprites/resources.png', { frameWidth: 48, frameHeight: 48 });

    // Actor sprite sheets
    this.scene.load.spritesheet(
      'actor', 'assets/sprites/actorBase-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet(
      'builder', 'assets/sprites/builder-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet(
      'lumberjack', 'assets/sprites/lumberjack-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet(
      'metalminer', 'assets/sprites/metalminer-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet(
      'mineralminer', 'assets/sprites/mineralminer-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });
    this.scene.load.spritesheet(
      'hunter', 'assets/sprites/hunter-export-extruded.png', { frameWidth: 48, frameHeight: 48, margin: 1, spacing: 2 });

    this.scene.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 48, frameHeight: 48 });

    this.scene.load.spritesheet('arrow', 'assets/sprites/arrow.png', { frameWidth: 48, frameHeight: 48 });

    this.scene.load.animation('actorAnimations', 'assets/json/actorAnimations.json');
  }

  createMap() {
    this.tileMap = this.scene.make.tilemap({
      tileWidth: 48, tileHeight: 48,
      width: this.mapWidth,
      height: this.mapHeight
    });

    this.mainCamera = this.scene.cameras.main;

    this.resourceAnimationGroup = this.scene.add.group();
    this.minimapIconGroup = this.scene.add.group();
    this.unitGroup = this.scene.add.group();
    this.enemyGroup = this.scene.add.group();
    this.projectileGroup = this.scene.add.group();
    this.pathfindingTestGroup = this.scene.add.group();

    this.unitAttackCircle = this.scene.add.circle(0, 0, 1, 0xff0000, 0.4);
    this.unitAttackCircle.setDepth(3);

    this.unitPlaceCircle = this.scene.add.circle(0, 0, 1, 0x0000ff, 0.3);
    this.unitPlaceCircle.setDepth(3);

    this.scene.physics.add.collider(this.projectileGroup, this.enemyGroup, this.projectileCollide);

    const saveDataExists = this.game.settings.saveDataExists;
    if (saveDataExists) {
      const saveData = this.game.settings.readSave();
      this.seedRng(saveData.settings.prngSeed);
    }

    this.initializeMap(saveDataExists);

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

    const xMax = this.groundLayer.tileToWorldX(this.mapWidth);
    const yMax = this.groundLayer.tileToWorldY(this.mapHeight);
    this.mainCamera.setBounds(0, 0, xMax, yMax, false).setName('main');

    this.minimapCamera = this.scene.cameras.add(this.mainCamera.width - this.minimapSize, this.mainCamera.height - this.minimapSize,
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

    this.canvasContainer.onwheel = event => this.zoomMap(event);
    document.onmouseup = _ => {
      if (this.cursorTool === CursorTool.PlaceBuildings) {
        this.game.pathfinding.updateGrid();
      } else if (this.cursorTool === CursorTool.ClearBuildings) {
        this.game.pathfinding.updatePaths(this.getGroundTile(this.pointerTileX, this.pointerTileY));
      }
    };
  }

  updateMap(elapsed, deltaTime) {
    this.resize();

    this.cameraControls.update(deltaTime);

    const pointer = this.scene.input.activePointer;

    const cursorWorldPoint = pointer.positionToCamera(this.mainCamera) as Phaser.Math.Vector2;

    this.pointerTileX = this.groundLayer.worldToTileX(cursorWorldPoint.x);
    this.pointerTileY = this.groundLayer.worldToTileY(cursorWorldPoint.y);

    this.minimapPanBox.x = this.mainCamera.worldView.x + this.mainCamera.width / 2;
    this.minimapPanBox.y = this.mainCamera.worldView.y + this.mainCamera.height / 2;
    this.minimapPanBox.width = this.mainCamera.worldView.width;
    this.minimapPanBox.height = this.mainCamera.worldView.height;
    this.minimapPanBox.depth = 2;

    const camerasBelowCursor = this.scene.cameras.getCamerasBelowPointer(pointer);

    // Drawing circles to indicate unit attack ranges

    if (this.focusedUnit) {
      this.unitAttackCircle.visible = true;

      this.unitAttackCircle.radius = this.focusedUnit.attackRange * this.tilePixelSize;

      // For some reason, the circle object's x and y are offset from its center slightly...
      this.unitAttackCircle.x = this.focusedUnit.x - this.unitAttackCircle.radius / 2;
      this.unitAttackCircle.y = this.focusedUnit.y - this.unitAttackCircle.radius / 2;
    } else {
      this.unitAttackCircle.visible = false;
    }

    if (this.cursorTool === CursorTool.PlaceUnits) {
      const selectedUnit = this.game.unit.selectedUnitType;
      const selectedUnitData = this.game.unit.unitsData[selectedUnit];
      this.unitPlaceCircle.visible = true;

      const tileRadius = (selectedUnit ? selectedUnitData.attackRange : 0);
      this.unitPlaceCircle.radius = tileRadius * this.tilePixelSize;

      // Don't question the wierd math, it just works
      this.unitPlaceCircle.x = this.groundLayer.tileToWorldX(this.pointerTileX - Math.floor(tileRadius / 2));
      this.unitPlaceCircle.y = this.groundLayer.tileToWorldY(this.pointerTileY - Math.floor(tileRadius / 2));

    } else {
      this.unitPlaceCircle.visible = false;
    }

    if (camerasBelowCursor.includes(this.minimapCamera)) {
      this.clickMinimap();
    } else {
      this.clickMap();
    }

    // Updating tilemap GameObjects

    if (!this.groundLayer) {
      return;
    }

    const resourceAnimations = this.resourceAnimationGroup.children.entries.map(anim => anim as ResourceAnimation);
    resourceAnimations.map(animation => animation.tick(elapsed, deltaTime));

    for (const tile of this.groundLayer.filterTiles(_tile => _tile.properties['buildingNode'])) {
      tile.properties['buildingNode'].tick(elapsed, deltaTime);
    }

    if (this.game.enemy.enemiesActive && elapsed - this.lastEnemySpawnTime >= this.enemySpawnInterval
        && this.enemyGroup.countActive() < this.maxEnemyCount) {
      const tile = this.getRandomTile([MapTileType.Grass], true);
      this.spawnEnemy(EnemyType.Raider, tile);

      this.lastEnemySpawnTime = elapsed;
    }

    for (const enemy of this.enemyGroup.getChildren().filter(_enemy => _enemy.active)) {
      (enemy as Enemy).tick(elapsed, deltaTime);
    }

    for (const unit of this.unitGroup.getChildren().filter(_unit => _unit.active)) {
      (unit as Unit).tick(elapsed, deltaTime);
    }

    for (const projectile of this.projectileGroup.getChildren().filter(_projectile => _projectile.active)) {
      (projectile as Projectile).tick(elapsed, deltaTime);
    }

    // Update other managers

    this.game.pathfinding.tick(elapsed, deltaTime);
    this.game.tasks.tick(elapsed, deltaTime);
    this.game.harvest.tick(elapsed, deltaTime);
    this.game.settings.tick(elapsed, deltaTime);
  }

  resize() {
    this.mapManager.resize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
    this.scene.cameras.resize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);

    if (this.minimapCamera) {
      this.minimapCamera.setViewport(this.canvasContainer.clientWidth - this.minimapSize,
        this.canvasContainer.clientHeight - this.minimapSize, this.minimapSize, this.minimapSize);
    }
  }

  clickMap() {
    const pointer = this.scene.input.activePointer;

    if (pointer.justDown) {
      this.followingUnit = false;
      this.mainCamera.stopFollow();

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
        this.createBuilding(this.pointerTileX, this.pointerTileY, this.game.buildings.selectedBuilding, true);
      } else if (pointer.primaryDown && this.cursorTool === CursorTool.ClearBuildings) {
        this.clearBuilding(this.pointerTileX, this.pointerTileY);
      }
    } else if (pointer.justUp && !this.isDraggingScreen) {
      switch (this.cursorTool) {
        case CursorTool.PlaceBuildings: {
          this.createBuilding(this.pointerTileX, this.pointerTileY, this.game.buildings.selectedBuilding, true);

          break;
        } case CursorTool.TileDetail: {
          const tile = this.getGroundTile(this.pointerTileX, this.pointerTileY);
          if (tile.properties['resourceNode'] || tile.properties['buildingNode']) {
            this.focusedTile = tile;
          } else {
            this.focusedTile = null;
          }

          break;
        } case CursorTool.PlaceUnits: {
          this.spawnUnit(this.game.unit.selectedUnitType, this.pointerTileX, this.pointerTileY);

          break;
        } case CursorTool.UnitDetail: {
          const tile = this.getGroundTile(this.pointerTileX, this.pointerTileY);
          if (tile.properties['resourceNode'] || tile.properties['buildingNode']) {
            this.focusedTile = tile;
          }

          this.focusedUnit = this.unitGroup.getChildren().find(unit => (unit as Unit).currentTile === tile) as Unit;
          if (!this.focusedUnit) {
            this.focusedTile = null;
          }

          break;
        } case CursorTool.PathfindingTest1: {
          this.pathfindingTestGroup.clear(false, true);

          const tile = this.getGroundTile(this.pointerTileX, this.pointerTileY);
          const homeTile = this.groundLayer.findTile(_tile => _tile.properties['buildingNode'] &&
            _tile.properties['buildingNode'].tileType === BuildingTileType.Home);

          this.game.pathfinding.findPath(tile, homeTile, tilePath => {
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

          break;
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

  initializeMap(loadingSave: boolean) {
    if (!this.tileMap) {
      // We'll only reach this point when trying to load a save file before the Phaser objects are created.
      return;
    }

    if (this.oceanLayer) {
      this.oceanLayer.destroy();
    }

    if (this.groundLayer) {
      this.groundLayer.destroy();
    }

    if (this.mountainLayer) {
      this.mountainLayer.destroy();
    }

    if (this.resourceLayer) {
      this.resourceLayer.destroy();
    }

    if (this.buildingLayer) {
      this.buildingLayer.destroy();
    }

    this.tileMap.removeAllLayers();

    this.resourceAnimationGroup.clear(true, true);
    this.minimapIconGroup.clear(true, true);
    this.unitGroup.clear(true, true);
    this.enemyGroup.clear(true, true);
    this.projectileGroup.clear(true, true);
    this.pathfindingTestGroup.clear(true, true);

    this.mapIslands = [];

    const oceanTileset = this.tileMap.addTilesetImage('ocean', 'ocean', 48, 48);
    const grassTileset = this.tileMap.addTilesetImage('grass', 'grass', 48, 48, 1, 2);
    const mountainTileset = this.tileMap.addTilesetImage('mountain', 'mountain', 48, 48, 1, 2);
    const resourceTileset = this.tileMap.addTilesetImage('resourceSpawns', 'resourceSpawns', 48, 48, 1, 2);
    const buildingTileset = this.tileMap.addTilesetImage('buildings', 'buildings', 48, 48, 1, 2);

    this.mapLayerContainers[MapLayerType.Ocean].layer = this.tileMap.createBlankDynamicLayer('oceanLayer', oceanTileset);
    this.mapLayerContainers[MapLayerType.Ground].layer = this.tileMap.createBlankDynamicLayer('groundLayer', grassTileset);
    this.mapLayerContainers[MapLayerType.Mountain].layer = this.tileMap.createBlankDynamicLayer('mountainLayer', mountainTileset);
    this.mapLayerContainers[MapLayerType.Resources].layer = this.tileMap.createBlankDynamicLayer('resourceLayer', resourceTileset);
    this.mapLayerContainers[MapLayerType.Buildings].layer = this.tileMap.createBlankDynamicLayer('buildingLayer', buildingTileset);

    for (let y = 0; y < this.totalChunkY; y++) {
      for (let x = 0; x < this.totalChunkX; x++) {
        this.generateChunk(x, y);
      }
    }

    this.mapLayerContainers[MapLayerType.Ground].autotiler = new LayerAutotiler(this.groundLayer, true, this.game,
      (tile, _) => tile.properties['tileType'] !== MapTileType.Water);

    this.mapLayerContainers[MapLayerType.Mountain].autotiler = new LayerAutotiler(this.mountainLayer, true, this.game, (tile, _) => {
      const groundTile = this.groundLayer.getTileAt(tile.x, tile.y);
      return groundTile.properties['tileType'] === MapTileType.Mountain;
    });

    this.mapLayerContainers[MapLayerType.Buildings].autotiler = new LayerAutotiler(this.buildingLayer, false, this.game,
      (tile, _) => {
        const groundTile = this.groundLayer.getTileAt(tile.x, tile.y);
        const buildingNode: BuildingNode = groundTile.properties['buildingNode'];

        return buildingNode && buildingNode.tileData.subType === BuildingSubType.Path;
      }, tile => {
        const groundTile = this.groundLayer.getTileAt(tile.x, tile.y);
        const buildingNode: BuildingNode = groundTile.properties['buildingNode'];

        if (!buildingNode) {
          return 0;
        }

        switch (buildingNode.tileType) {
          case BuildingTileType.Road: {
            return 32;
          } case BuildingTileType.Tunnel: {
            return 80;
          } case BuildingTileType.Bridge: {
            return 128;
          } default: {
            return 0;
          }
        }
      });

    this.processIslands();

    // Placing home (unless one already exists)
    // We want to place the home closer to the center of the map.
    const homeTile = this.getRandomTile([MapTileType.Grass], true, this.mapWidth * 0.4,
                                                                   this.mapWidth * 0.6,
                                                                   this.mapHeight * 0.4,
                                                                   this.mapHeight * 0.6);
    const homeData = this.buildingTileData.get(BuildingTileType.Home);
    this.createBuilding(homeTile.x, homeTile.y, homeData, false);

    if (loadingSave) {
      this.game.settings.loadGame(false);
    } else {
      this.spawnUnit(UnitType.Builder, homeTile.x, homeTile.y, true);
    }

    this.mainCamera.centerOn(homeTile.pixelX, homeTile.pixelY);

    const minimapHomeIcon = this.scene.add.sprite(homeTile.pixelX, homeTile.pixelY,
      'buildingSprites', this.tileIndices[BuildingTileType.Home]);
    minimapHomeIcon.scaleX = 20;
    minimapHomeIcon.scaleY = 20;
    minimapHomeIcon.depth = 1;
    this.minimapIconGroup.add(minimapHomeIcon);
    this.mainCamera.ignore(minimapHomeIcon);

    // Placing an oak tree, stone mine, and wheat farm near the home, to ensure they're always available.
    // We want to vary up their positions a bit to feel more natural.
    const spawnAreaSize = 25;
    this.putResourceNearSpawn(ResourceTileType.StoneMine, spawnAreaSize, [MapTileType.Mountain, MapTileType.Grass]);
    this.putResourceNearSpawn(ResourceTileType.WheatFarm, spawnAreaSize, [MapTileType.Grass]);
    this.putResourceNearSpawn(ResourceTileType.OakTree, spawnAreaSize, [MapTileType.Grass]);

    // Final sweep to make sure all spawnable resources exist at least once.
    let naturalResources = Array.from(this.resourceTileData.values());
    naturalResources = naturalResources.filter(resource => resource.isNaturalResource);
    naturalResources = naturalResources.filter(resource =>
      !this.resourceLayer.findTile(tile => tile.properties['tileType'] === resource.tileType));

    for (const missingResource of naturalResources) {
      const resourceTile = this.getRandomTile(missingResource.spawnsOn, true);
      this.setResourceTile(resourceTile.x, resourceTile.y, missingResource.tileType, 50);
    }

    this.game.pathfinding.init();
    this.game.pathfinding.calculateResourceConnections();
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

        const tile = this.groundLayer.putTileAt(this.tileIndices[tileType], x, y);
        tile.properties['id'] = tileId;
        tile.properties['height'] = noiseValue;
        tile.properties['tileType'] = tileType;

        this.oceanLayer.putTileAt(0, x, y);

        if (tileType === MapTileType.Mountain) {
          this.mountainLayer.putTileAt(13, x, y);
        }
      }
    }

    const centerVector = new Phaser.Math.Vector2(this.mapWidth / 2, this.mapHeight / 2);
    const maxTier = Math.max(...this.game.resources.allResources.map(resource => resource.resourceTier));
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
            const neighborTile = this.getGroundTile(nx, ny);
            if (neighborTile && neighborTile.properties['height'] > maxNoise) {
              maxNoise = neighborTile.properties['height'];
            }
          }
        }

        const tile = this.getGroundTile(x, y);
        if (tile.properties['height'] === maxNoise) {
          const distanceToCenter = new Phaser.Math.Vector2(Math.abs(tile.x - centerVector.x),
                                                           Math.abs(tile.y - centerVector.y)).length();
          const tierValue = Math.floor(distanceToCenter / tierRingSize);

          let naturalResources = Array.from(this.resourceTileData.values());
          naturalResources = naturalResources.filter(resource => resource.spawnsOn.includes(tile.properties['tileType']));
          naturalResources = naturalResources.filter(resource => {
            const resourceTiers = resource.resourceEnums.map(resourceEnum =>
              this.game.resources.getResource(resourceEnum).resourceTier);
            return resourceTiers.some(tier => tier <= tierValue + 1 && tierValue - tier <= 2);
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
    if (noiseValue <= 0.12) {
      return MapTileType.Water;
    } else if (noiseValue < 0.9999999) {
      return MapTileType.Grass;
    } else {
      return MapTileType.Mountain;
    }
  }

  spawnHarvestedResourceAnimation(resource: Resource, multiplier: number = 1, spawnedByPlayer: boolean) {
    let matchingTiles = this.getResourceTiles(resource.resourceEnum).filter(_tile => _tile.properties['resourceNode'].path.length);

    if (!resource.canAfford(multiplier)) {
      return;
    }

    resource.deductResourceConsumes(multiplier);

    matchingTiles = matchingTiles.sort((a, b) => this.game.pathfinding.getPathWeight(a.properties['resourceNode'].path) -
                                                 this.game.pathfinding.getPathWeight(b.properties['resourceNode'].path));
    const tile = matchingTiles[0];
    if (tile === undefined) {
      return;
    }

    const tilePath: Phaser.Tilemaps.Tile[] = Array.from(tile.properties['resourceNode'].path);

    const animationType = spawnedByPlayer ? ResourceAnimationType.PlayerSpawned : ResourceAnimationType.WorkerSpawned;

    this.spawnResourceAnimation(resource.resourceEnum, multiplier, animationType, tile, tilePath, spawnedByPlayer);
  }

  spawnSoldResourceAnimation(resourceEnum: ResourceEnum, multiplier: number, market: Market) {
    this.spawnResourceAnimation(resourceEnum, multiplier, ResourceAnimationType.Sold, market.homeTile, market.tilePath, false, market);
  }

  spawnResourceAnimation(resourceEnum: ResourceEnum, multiplier: number, animationType: ResourceAnimationType,
                         startTile: Phaser.Tilemaps.Tile, tilePath: Phaser.Tilemaps.Tile[], spawnedByPlayer: boolean, market?: Market) {
    const worldX = this.groundLayer.tileToWorldX(startTile.x) + startTile.width / 4;
    const worldY = this.groundLayer.tileToWorldY(startTile.y) + startTile.height / 4;

    const resourceSpriteIndex = this.tileIndices[resourceEnum];

    const resourceAnimation = new ResourceAnimation(worldX, worldY, this.resourceAnimationSpeed,
      animationType, resourceEnum, multiplier, spawnedByPlayer, tilePath,
      this.scene, 'resources', resourceSpriteIndex, this.game);

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
    const projectile = new Projectile(owner.x, owner.y, this.projectileAnimationSpeed, owner, target, this.scene, 'arrow', 0, this.game);

    this.scene.physics.add.existing(projectile);
    this.projectileGroup.add(projectile, true);
    projectile.fireProjectile();
  }

  projectileCollide(projectile: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    (enemy as Enemy).takeDamage((projectile as Projectile));
    projectile.destroy();
  }

  spawnUnit(unitType: UnitType, tileX: number, tileY: number, spawnForFree = false): Unit {
    const spawnTile = this.groundLayer.getTileAt(tileX, tileY);
    const unitData = this.game.unit.unitsData[unitType];

    if (!spawnForFree && (!this.game.unit.canAffordUnit(unitType) ||
        !this.isTileWalkable(spawnTile) || (spawnTile.properties['buildingNode'] &&
        !this.buildingTileData.get(spawnTile.properties['buildingNode'].tileType).resourcePathable) ||
        this.unitGroup.getChildren().some(_unit => (_unit as Unit).currentTile === spawnTile))) {
      return;
    }

    if (!spawnForFree) {
      this.game.unit.purchaseUnit(unitType);
    }

    let unit: Unit;

    switch (unitType) {
      case UnitType.Sentry: {
        unit = new Sentry(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData,
          this.scene, 'actor', 0, this.game);
        break;
      } case UnitType.Builder: {
        unit = new Builder(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData,
          this.scene, 'builder', 0, this.game);
        break;
      } case UnitType.Lumberjack: {
        unit = new Harvester(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData, ResourceType.Wood,
          this.scene, 'lumberjack', 0, this.game);
        break;
      } case UnitType.MineralMiner: {
        unit = new Harvester(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData, ResourceType.Mineral,
          this.scene, 'mineralminer', 0, this.game);
        break;
      } case UnitType.MetalMiner: {
        unit = new Harvester(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData, ResourceType.Metal,
          this.scene, 'metalminer', 0, this.game);
        break;
      } case UnitType.Hunter: {
        unit = new Harvester(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData, ResourceType.Food,
          this.scene, 'hunter', 0, this.game);
        break;
      } case UnitType.Merchant: {
        unit = new Merchant(spawnTile.getCenterX(), spawnTile.getCenterY(), unitData, ResourceType.Wood,
          this.scene, 'actor', 0, this.game);
        break;
      } default: {
        return null;
      }
    }

    this.unitGroup.add(unit, true);
    return unit;
  }

  spawnEnemy(enemyType: EnemyType, tile: Phaser.Tilemaps.Tile): Enemy {
    if (this.enemyGroup.countActive() > this.maxEnemyCount) {
      return;
    }

    const enemyData = this.game.enemy.enemiesData[enemyType];
    const cappedScore = Math.min(3000, this.game.resources.playerScore / 50000);
    const difficultyModifier = Math.max(1, Math.random() * cappedScore);

    let enemy: Enemy;

    switch (enemyType) {
      case EnemyType.Raider: {
        enemy = new Raider(tile.getCenterX(), tile.getCenterY(), enemyData, difficultyModifier,
          this.scene, 'enemy', 0, this.game);
      }
    }

    this.scene.physics.add.existing(enemy);
    this.enemyGroup.add(enemy, true);
    (enemy.body as Phaser.Physics.Arcade.Body).moves = false;

    return enemy;
  }

  getRandomTile(mapTileTypes?: MapTileType[], avoidResources = false,
      minX = 0, maxX = Infinity, minY = 0, maxY = Infinity): Phaser.Tilemaps.Tile {
    let tiles = this.groundLayer.getTilesWithin(minX, minY, maxX - minX, maxY - minY);

    if (mapTileTypes) {
      tiles = tiles.filter(tile => mapTileTypes.includes(tile.properties['tileType']));
    }
    if (avoidResources) {
      tiles = tiles.filter(tile => !tile.properties['resourceNode']);
    }

    return tiles[Math.floor(this.rng.nextDouble() * tiles.length)];
  }

  getRandomIslandId(minimumSize = 1, mapTileTypes?: MapTileType[]): number {
    let islands = this.mapIslands.filter(island => island.tiles.length >= minimumSize);

    if (mapTileTypes) {
      islands = islands.filter(island => {
        const tileTypes = island.tiles.map(tile => this.groundLayer.getTileAt(tile.x, tile.y).properties['tileType']);
        return tileTypes.filter(type => mapTileTypes.includes(type)).length >= minimumSize;
      });
    }

    const selectedIsland = islands[Math.floor(Math.random() * islands.length)];

    return this.mapIslands.indexOf(selectedIsland);
  }

  getRandomTileOnIsland(islandId: number, mapTileTypes?: MapTileType[],
      avoidResources = false, getActiveBuilding = false): Phaser.Tilemaps.Tile {
    let islandTiles = this.mapIslands[islandId].tiles.map(tile => this.groundLayer.getTileAt(tile.x, tile.y));

    if (mapTileTypes) {
      islandTiles = islandTiles.filter(tile => mapTileTypes.includes(tile.properties['tileType']));
    }

    if (avoidResources) {
      islandTiles = islandTiles.filter(tile => !tile.properties['resourceNode']);
    }

    if (getActiveBuilding) {
      islandTiles = islandTiles.filter(tile => tile.properties['buildingNode'] &&
        tile.properties['buildingNode'].health > 0 && tile.properties['buildingNode'].tileType !== BuildingTileType.Home);
    }

    return islandTiles[Math.floor(Math.random() * islandTiles.length)];
  }

  islandHasActiveTiles(islandId: number): boolean {
    const islandTiles = this.mapIslands[islandId].tiles.map(tile => this.groundLayer.getTileAt(tile.x, tile.y));
    return islandTiles.some(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].health > 0 && tile.properties['buildingNode'].tileType !== BuildingTileType.Home);
  }

  createBuilding(x: number, y: number, buildingData: BuildingTileData, removable: boolean): BuildingNode {
    if (!buildingData) {
      return;
    }

    const buildingExists = this.buildingLayer.getTileAt(x, y) != null;
    const resourceExists = this.resourceLayer.getTileAt(x, y) != null;

    const mapTile = this.groundLayer.getTileAt(x, y);
    const canPlaceHere = buildingData.buildableSurfaces.includes(mapTile.properties['tileType']);

    if (buildingExists || resourceExists || !canPlaceHere) {
      return;
    }

    this.setBuildingTile(x, y, buildingData.tileType, removable);

    if (buildingData.placesResourceTile) {
      const resourceData = this.resourceTileData.get(buildingData.resourceTileType);

      mapTile.properties['resourceNode'] = new ResourceNode(buildingData.resourceTileType,
        mapTile, resourceData.resourceEnums, buildingData.baseHealth);
    }

    // If we're building a bridge, we need to update the island structure
    if (!this.mapTileData.get(mapTile.properties['tileType']).walkable) {
      const islands = this.getNeighborTiles(mapTile).map(tile => tile.properties['islandId'])
        .filter(id => !isNaN(id) && this.mapIslands[id].tiles.length);
      const uniqueIslands = [];
      for (const island of islands) {
        if (!uniqueIslands.includes(island)) {
          uniqueIslands.push(island);
        }
      }

      const islandId = uniqueIslands.length ? uniqueIslands[0] : this.mapIslands.length;
      mapTile.properties['islandId'] = islandId;

      if (!uniqueIslands.length) {
        this.mapIslands[islandId] = {tiles: []};
      }

      this.mapIslands[islandId].tiles.push({x: mapTile.x, y: mapTile.y});

      for (const oldIslandId of uniqueIslands.filter((_, index) => index > 0)) {
        const oldIsland = this.mapIslands[oldIslandId];

        for (const tileCoordinate of oldIsland.tiles) {
          this.groundLayer.getTileAt(tileCoordinate.x, tileCoordinate.y).properties['islandId'] = islandId;
        }

        this.mapIslands[islandId].tiles = this.mapIslands[islandId].tiles.concat(oldIsland.tiles);

        oldIsland.tiles = [];
      }
    }

    return mapTile.properties['buildingNode'];
  }

  clearBuilding(x: number, y: number) {
    const buildingTile = this.groundLayer.getTileAt(x, y);
    const mapTile = this.groundLayer.getTileAt(x, y);
    if (!buildingTile || !buildingTile.properties['buildingNode'] || !buildingTile.properties['buildingNode'].removable) {
      return;
    }

    const buildingNode: BuildingNode = buildingTile.properties['buildingNode'];
    const buildingData = this.buildingTileData.get(buildingNode.tileType);

    this.game.buildings.refundBuilding(buildingData, buildingNode.health / buildingNode.maxHealth);

    this.groundLayer.getTileAt(x, y).properties['buildingNode'].destroy();
    this.clearBuildingTile(x, y);
    if (buildingData.placesResourceTile) {
      this.clearResourceTile(x, y);
    }

    // If we're removing a bridge, we need to update the island structure
    if (this.mapTileData.get(mapTile.properties['tileType']).tileType === MapTileType.Water) {
      const neighbors = this.getNeighborTiles(mapTile);
      for (let i = 0; i < neighbors.length - 1; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (neighbors[i].properties['islandId'] === undefined || neighbors[j].properties['islandId'] === undefined) {
            continue;
          }

          this.game.pathfinding.findPath(neighbors[i], neighbors[j], tilePath => {
            if (!tilePath.length) {
              this.mapIslands[neighbors[i].properties['islandId']].tiles = [];
              this.mapIslands[neighbors[j].properties['islandId']].tiles = [];

              this.processIslands(neighbors[i]);
              this.processIslands(neighbors[j]);
            }
          });
        }
      }

      mapTile.properties['islandId'] = undefined;
    }

    this.game.pathfinding.updateGrid();
  }

  processIslands(startTile?: Phaser.Tilemaps.Tile) {
    const tilesToProcess = startTile ? [startTile] :
      this.groundLayer.filterTiles(_tile => _tile.properties['tileType'] !== MapTileType.Water);

    const visitedTileIds: number[] = [];
    for (const tile of tilesToProcess) {
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
    }
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
      if (position.x >= 0 && position.x < this.mapWidth &&
          position.y >= 0 && position.y < this.mapHeight) {
        tiles.push(this.getGroundTile(position.x, position.y));
      }
    }

    return tiles;
  }

  getChunkOffset(x: number, y: number) {
    const chunkIndex = Math.floor(x / this.chunkWidth) + this.totalChunkX * Math.floor(y / this.chunkHeight);
    return chunkIndex * this.chunkWidth * this.chunkHeight;
  }

  getTileFromLayer(x: number, y: number, layer: Phaser.Tilemaps.DynamicTilemapLayer) {
    return layer.getTileAt(x, y);
  }

  getGroundTile(x: number, y: number): Phaser.Tilemaps.Tile {
    return this.groundLayer.getTileAt(x, y);
  }

  setGroundTile(x: number, y: number, tile: Phaser.Tilemaps.Tile) {
    this.groundLayer.putTileAt(tile, x, y);
  }

  clearGroundTile(x: number, y: number) {
    this.groundLayer.removeTileAt(x, y);
  }

  setBuildingTile(x: number, y: number, tileType: BuildingTileType, removable: boolean): Phaser.Tilemaps.Tile {
    const buildingTile = this.buildingLayer.putTileAt(this.tileIndices[tileType], x, y);

    const mapTile = this.groundLayer.getTileAt(x, y);

    const buildingData = this.buildingTileData.get(tileType);

    switch (buildingData.subType) {
      case BuildingSubType.Market: {
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

        mapTile.properties['buildingNode'] = new Market(resourceType, mapTile, buildingData, this.scene, this.game);
        break;
      } default: {
        mapTile.properties['buildingNode'] = new BuildingNode(tileType, removable, buildingData, mapTile, this.scene, this.game);
        break;
      }
    }

    this.mapLayerContainers[MapLayerType.Buildings].autotiler.tileUpdated(buildingTile);

    return this.buildingLayer.getTileAt(x, y);
  }

  clearBuildingTile(x: number, y: number) {
    const buildingTile = this.buildingLayer.removeTileAt(x, y);

    const mapTile = this.groundLayer.getTileAt(x, y);
    mapTile.properties['buildingNode'] = null;

    this.mapLayerContainers[MapLayerType.Buildings].autotiler.tileUpdated(buildingTile);
  }

  putResourceNearSpawn(resourceTileType: ResourceTileType, spawnAreaSize: number, desiredSpawnTypes: MapTileType[]) {
    const homeTile = this.getHomeTile();

    const spawnArea = this.groundLayer.getTilesWithin(homeTile.x - Math.floor(spawnAreaSize / 2),
      homeTile.y - Math.floor(spawnAreaSize / 2), spawnAreaSize, spawnAreaSize);

    if (spawnArea.some(tile => tile.properties['resourceNode'] && tile.properties['resourceNode'].tileType === resourceTileType)) {
      return;
    }

    const spawnTile = this.getRandomTile(desiredSpawnTypes, true,
      homeTile.x - Math.floor(spawnAreaSize / 2), homeTile.x + Math.floor(spawnAreaSize / 2),
      homeTile.y - Math.floor(spawnAreaSize / 2), homeTile.y + Math.floor(spawnAreaSize / 2));

    if (spawnTile) {
      this.setResourceTile(spawnTile.x, spawnTile.y, resourceTileType, 50);
    }
  }

  setResourceTile(x: number, y: number, tileType: ResourceTileType, health: number): Phaser.Tilemaps.Tile {
    const resourceData = this.resourceTileData.get(tileType);

    this.resourceLayer.putTileAt(this.tileIndices[tileType], x, y);

    const mapTile = this.groundLayer.getTileAt(x, y);
    mapTile.properties['resourceNode'] = new ResourceNode(tileType, mapTile, resourceData.resourceEnums, health);

    return this.resourceLayer.getTileAt(x, y);
  }

  clearResourceTile(x: number, y: number) {
    this.resourceLayer.removeTileAt(x, y);

    const mapTile = this.groundLayer.getTileAt(x, y);
    mapTile.properties['resourceNode'] = null;
  }

  clearLayeredTile(x: number, y: number) {
    this.groundLayer.getTileAt(x, y).properties['buildingNode'].destroy();

    this.clearGroundTile(x, y);
    this.clearBuildingTile(x, y);
    this.clearResourceTile(x, y);
  }

  getResourceTiles(resourceEnumOrEnums?: ResourceEnum | ResourceEnum[]): Phaser.Tilemaps.Tile[] {
    let resourceEnums = [];
    if (resourceEnumOrEnums) {
      resourceEnums = resourceEnums.concat(resourceEnumOrEnums);
    }

    let tiles = this.groundLayer.filterTiles(tile => tile.properties['resourceNode']);

    if (resourceEnums.length) {
      const tileData = Array.from(this.resourceTileData.values());

      const matchingTypes = tileData.filter(tile =>
        tile.resourceEnums.some(resourceEnum => resourceEnums.includes(resourceEnum))).map(
          data => data.tileType);

      tiles = tiles.filter(tile => matchingTypes.includes(tile.properties['resourceNode'].tileType));
    }

    return tiles;
  }

  // TODO: Move all building-related logic to building-manager.ts
  getBuildingTiles(buildingTypeOrTypes?: BuildingTileType | BuildingTileType[]): Phaser.Tilemaps.Tile[] {
    const buildingTypes = [].concat(buildingTypeOrTypes);

    let tiles = this.groundLayer.filterTiles(tile => tile.properties['buildingNode']);

    if (buildingTypeOrTypes) {
      tiles = tiles.filter(tile => buildingTypes.includes(tile.properties['buildingNode'].tileType));
    }

    return tiles;
  }

  getHomeTile(): Phaser.Tilemaps.Tile {
    const homeTiles = this.getBuildingTiles(BuildingTileType.Home);

    return homeTiles && homeTiles.length ? homeTiles[0] : null;
  }

  isTilePathable(tile: Phaser.Tilemaps.Tile): boolean {
    const buildingNode: BuildingNode = tile.properties['buildingNode'];
    const buildingData: BuildingTileData = buildingNode ? this.buildingTileData.get(buildingNode.tileType) : null;

    return buildingNode && buildingNode.health > 0 && buildingData && buildingData.resourcePathable;
  }

  isTileWalkable(tile: Phaser.Tilemaps.Tile): boolean {
    const tileType: MapTileType = tile.properties['tileType'];
    const buildingNode: BuildingNode = tile.properties['buildingNode'];
    const resourceNode: ResourceNode = tile.properties['resourceNode'];
    const buildingData: BuildingTileData = buildingNode ? this.buildingTileData.get(buildingNode.tileType) : null;

    if (resourceNode && !buildingNode) {
      return false;
    } else if (buildingData && buildingData.subType === BuildingSubType.Obstacle && buildingNode.health > 0) {
      return false;
    } else {
      return this.mapTileData.get(tileType).walkable || (buildingData && buildingData.resourcePathable);
    }
  }

  updateIslandDebugData() {
    for (const island of this.mapIslands.filter(_island => _island.tiles.length)) {
      const islandTint = Math.random() * 0xffffff44;

      for (const tileCoordinate of island.tiles) {
        const tile = this.groundLayer.getTileAt(tileCoordinate.x, tileCoordinate.y);

        tile.tint = islandTint;
      }
    }

    for (const tile of this.groundLayer.filterTiles(_tile => _tile.properties['islandId'] === undefined)) {
      tile.tint = 0xffffffff;
    }
  }

  public get oceanLayer(): Phaser.Tilemaps.DynamicTilemapLayer {
    return this.mapLayerContainers[MapLayerType.Ocean].layer;
  }

  public get groundLayer(): Phaser.Tilemaps.DynamicTilemapLayer {
    return this.mapLayerContainers[MapLayerType.Ground].layer;
  }

  public get mountainLayer(): Phaser.Tilemaps.DynamicTilemapLayer {
    return this.mapLayerContainers[MapLayerType.Mountain].layer;
  }

  public get buildingLayer(): Phaser.Tilemaps.DynamicTilemapLayer {
    return this.mapLayerContainers[MapLayerType.Buildings].layer;
  }

  public get resourceLayer(): Phaser.Tilemaps.DynamicTilemapLayer {
    return this.mapLayerContainers[MapLayerType.Resources].layer;
  }

  private get enemyGroup(): Phaser.GameObjects.Group {
    return this.game.enemy.enemyGroup;
  }

  private set enemyGroup(value: Phaser.GameObjects.Group) {
    this.game.enemy.enemyGroup = value;
  }

  private get unitGroup(): Phaser.GameObjects.Group {
    return this.game.unit.unitGroup;
  }

  private set unitGroup(value: Phaser.GameObjects.Group) {
    this.game.unit.unitGroup = value;
  }

  get mapWidth(): number {
    return this.totalChunkX * this.chunkWidth;
  }

  get mapHeight(): number {
    return this.totalChunkY * this.chunkHeight;
  }

  get scene(): Phaser.Scene {
    return this.mapManager.scene.scenes[0];
  }
}
