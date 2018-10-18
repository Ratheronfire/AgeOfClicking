import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { MapTileType, BuildingTileType } from '../../objects/tile';
import { Vector } from '../../objects/vector';
import { ResourcesService } from './../../services/resources/resources.service';
import { SettingsService } from './../../services/settings/settings.service';
import { EnemyService } from '../../services/enemy/enemy.service';
import { FighterService } from './../../services/fighter/fighter.service';
import { BuildingsService } from './../../services/buildings/buildings.service';
import { MapService, CursorTool } from './../../services/map/map.service';
import { Tick } from './../../services/tick/tick.service';

declare var d3: any;

@Directive({
  selector: '[appMap]'
})
export class MapDirective implements AfterViewInit, Tick {
  canvas;
  context: CanvasRenderingContext2D;
  canvasContainer: Element;

  lastEnemyReprosessTime = Date.now();
  enemyReprocessDelay = 2000;

  tileTooltip: any;
  fighterTooltip: any;

  headerPixels = 64;

  refreshTimer;
  lowFramerateActive = false;

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected resourcesService: ResourcesService,
              protected settingsService: SettingsService,
              protected enemyService: EnemyService,
              protected fighterService: FighterService,
              protected buildingsService: BuildingsService,
              protected mapService: MapService) { }

  ngAfterViewInit() {
    this.canvas = d3.select('canvas#map');
    this.context = this.canvas.node().getContext('2d');
    this.canvasContainer = document.getElementById('map-canvas-container');

    this.tileTooltip = document.getElementById('tile-tooltip');
    this.fighterTooltip = document.getElementById('fighter-tooltip');

    this.context.font = 'bold 4px Arial';

    this.resizeCanvas();

    this.canvas.call(d3.zoom()
        .filter(this.scrollFilter(this))
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [this.mapService.chunkWidth * this.mapService.tilePixelSize  * this.mapService.totalChunkX,
                                   this.mapService.chunkHeight * this.mapService.tilePixelSize * this.mapService.totalChunkY]])
        .on('zoom', this.zoomed(this)));

    this.canvas.on('mousedown mousemove mouseup', this.clickTile(this));

    this.refreshTimer = d3.interval(this.refreshCanvas(this), 25);

    const homeTile = this.mapService.tileMap.find(tile => tile && tile.buildingTileType === BuildingTileType.Home);
    this.mapService.setCameraCenter(homeTile.position.multiply(-1));
  }

  tick(elapsed: number) {

  }

  scrollFilter(self: MapDirective) {
    return function(elapsed) {
      return d3.event.type !== 'dblclick' && (d3.event.type !== 'mousedown' || d3.event.button === 2);
    };
  }

  zoomed(self: MapDirective) {
    return function(elapsed) {
      self.transform = d3.event.transform;
    };
  }

  clickTile(self: MapDirective) {
    return async function(elapsed) {
      if (!d3.event.buttons && d3.event.type !== 'mouseup') {
        return;
      }

      const coordinates = d3.mouse(this);
      coordinates[0] = Math.floor(self.transform.invertX(coordinates[0]) / self.mapService.tilePixelSize);
      coordinates[1] = Math.floor(self.transform.invertY(coordinates[1]) / self.mapService.tilePixelSize);

      const tile = self.mapService.getTile(coordinates[0], coordinates[1]);

      let shouldUpdateEnemies = false;

      if (d3.event.type === 'mousedown' && self.mapService.cursorTool === CursorTool.TileDetail) {
        self.updateTileTooltip(coordinates);
      } else if (d3.event.type === 'mousedown' && self.mapService.cursorTool === CursorTool.FighterDetail) {
        self.updateFighterTooltip(coordinates);
      } else if (self.mapService.cursorTool === CursorTool.PlaceBuildings && self.buildingsService.selectedBuilding) {
        const buildingCreated = self.buildingsService.createBuilding(tile, self.buildingsService.selectedBuilding.tileType);
        shouldUpdateEnemies = d3.event.type === 'mouseup' && buildingCreated;
      } else if (self.mapService.cursorTool === CursorTool.ClearBuildings) {
        const buildingCleared = self.buildingsService.clearBuilding(tile);
        shouldUpdateEnemies = d3.event.type === 'mouseup' && buildingCleared;
      } else if (d3.event.type === 'mousedown' &&
        self.mapService.cursorTool === CursorTool.PlaceFighters && self.fighterService.selectedFighterType) {
        self.fighterService.createFighter(tile, self.fighterService.selectedFighterType);
      }

      if (shouldUpdateEnemies && Date.now() - self.lastEnemyReprosessTime > self.enemyReprocessDelay) {
        self.lastEnemyReprosessTime = Date.now();
        await self.enemyService.recalculateTargets();
      }
    };
  }

  updateTileTooltip(coordinates: number[]) {
    const focusedTile = this.mapService.getTile(coordinates[0], coordinates[1]);

    if (focusedTile.buildingTileType || focusedTile.resourceTileType) {
      this.mapService.focusedTile = focusedTile;
      this.mapService.focusedBuildingTile = this.mapService.buildingTiles.get(focusedTile.buildingTileType);
      this.mapService.focusedResourceTile = this.mapService.resourceTiles.get(focusedTile.resourceTileType);
      this.mapService.focusedResources = this.mapService.focusedResourceTile ?
        this.mapService.focusedResourceTile.resourceEnums.map(rEnum => this.resourcesService.resources.get(rEnum)) : undefined;
    } else {
      this.mapService.focusedTile = undefined;
      this.mapService.focusedBuildingTile = undefined;
      this.mapService.focusedResourceTile = undefined;
      this.mapService.focusedResources = undefined;
    }
  }

  updateFighterTooltip(coordinates: number[]) {
    const focusedTile = this.mapService.getTile(coordinates[0], coordinates[1]);
    const focusedFighter = this.fighterService.fighters.find(fighter => fighter.currentTile === focusedTile);

    if (focusedFighter) {
      this.mapService.focusedTile = focusedTile;
      this.mapService.focusedFighter = focusedFighter;
    } else {
      this.mapService.focusedTile = undefined;
      this.mapService.focusedFighter = undefined;
    }
  }

  resizeCanvas() {
    this.element.nativeElement.width = this.canvasContainer.clientWidth;
    this.element.nativeElement.height = window.innerHeight - this.headerPixels;
    this.canvasPixelWidth = this.canvasContainer.clientWidth;
    this.canvasPixelHeight = window.innerHeight - this.headerPixels;
  }

  refreshCanvas(self: MapDirective) {
    return function (elapsed) {
      if (self.lowFramerateActive !== self.settingsService.mapLowFramerate) {
        self.lowFramerateActive = self.settingsService.mapLowFramerate;

        self.refreshTimer.stop();
        self.refreshTimer = d3.interval(self.refreshCanvas(self),
        self.lowFramerateActive ? self.mapService.lowFramerate : self.mapService.highFramerate);
      }

      self.resizeCanvas();

      self.context.save();
      self.context.clearRect(0, 0, self.canvasPixelWidth, self.canvasPixelHeight);
      self.context.translate(self.transform.x, self.transform.y);
      self.context.scale(self.transform.k, self.transform.k);
      self.drawCanvas();
      self.context.restore();
    };
  }

  drawCanvas() {
    const cameraBounds = this.mapService.mapCameraBounds;

    const upperLeftTile =
      [Math.max(0, Math.floor(cameraBounds[0].x / this.mapService.tilePixelSize)),
       Math.max(0, Math.floor(cameraBounds[0].y / this.mapService.tilePixelSize))];
    const lowerRightTile =
      [Math.floor(cameraBounds[1].x / this.mapService.tilePixelSize),
       Math.floor(cameraBounds[1].y / this.mapService.tilePixelSize)];

    for (let y = upperLeftTile[1]; y <= lowerRightTile[1]; y++) {
      for (let x = upperLeftTile[0]; x <= lowerRightTile[0]; x++) {
        const tile = this.mapService.getTile(x, y);

        if (!tile) {
          continue;
        }

        const mapTileName = tile.mapTileType.toLowerCase();
        this.drawTile(tile.position, mapTileName);

        if (tile.buildingTileType) {
          const buildingTileName = tile.buildingTileType.toLowerCase();
          this.drawTile(tile.position, buildingTileName);
        }

        if (tile.resourceTileType) {
          const resourceTileName = tile.resourceTileType.toLowerCase().replace(' ', '-');
          this.drawTile(tile.position, resourceTileName, 1, tile.health / tile.maxHealth);
        }

        if (tile.health === 0) {
          this.context.globalAlpha = 0.5;
          this.drawTile(tile.position, 'disabled');
          this.context.globalAlpha = 1;
        } else if (tile.buildingTileType && !tile.buildingRemovable && this.mapService.cursorTool === CursorTool.ClearBuildings) {
          this.context.globalAlpha = 0.5;
          this.drawTile(tile.position, 'locked');
          this.context.globalAlpha = 1;
        }
      }
    }

    for (const resourceAnimation of this.mapService.resourceAnimations) {
      const resourceTileName = this.resourcesService.resources.get(resourceAnimation.resourceEnum).name.toLowerCase().replace(/ /g, '-');
      this.drawTile(resourceAnimation.position, resourceTileName, 0.5);

      this.context.fillStyle = this.settingsService.resourceAnimationColors[resourceAnimation.animationType];

      this.context.fillText(Math.floor(resourceAnimation.multiplier).toString(),
        resourceAnimation.x + this.mapService.tilePixelSize / 2, resourceAnimation.y + this.mapService.tilePixelSize / 2);
    }

    for (const enemy of this.enemyService.enemies) {
      const enemyTileName = enemy.name.toLowerCase().replace(' ', '-');
      this.drawTile(enemy.position, enemyTileName, 1, enemy.health / enemy.maxHealth);
    }

    for (const fighter of this.fighterService.fighters) {
      const fighterTileName = fighter.name.toLowerCase().replace(' ', '-');
      this.drawTile(fighter.position, fighterTileName, 1, fighter.health / fighter.maxHealth);
    }

    for (const projectile of this.mapService.projectiles) {
      const projectileTileName = projectile.name.toLowerCase().replace(' ', '-');

      this.context.translate(projectile.x, projectile.y);
      this.context.rotate(projectile.rotation);
      this.drawTile(new Vector(-this.mapService.tilePixelSize / 2, -this.mapService.tilePixelSize / 2), projectileTileName);
      this.context.rotate(-projectile.rotation);
      this.context.translate(-projectile.x, -projectile.y);
    }

    if (this.mapService.focusedTile) {
      const tooltipPosition = this.getTooltipPosition(this.mapService.focusedTile.position);
      this.tileTooltip.style.setProperty('--detail-tooltip-left', tooltipPosition.x + 'px');
      this.tileTooltip.style.setProperty('--detail-tooltip-top', tooltipPosition.y + 'px');

      this.context.globalAlpha = 0.5;
      this.context.fillStyle = 'cyan';
      for (const pathTile of this.mapService.focusedTile.buildingPath) {
        this.context.fillRect(pathTile.x, pathTile.y, this.mapService.tilePixelSize, this.mapService.tilePixelSize);
      }
      this.context.fillStyle = 'black';
      this.context.globalAlpha = 1;
    }

    if (this.mapService.focusedFighter) {
      const fighter = this.mapService.focusedFighter;

      const tooltipPosition = this.getTooltipPosition(fighter.position);
      this.fighterTooltip.style.setProperty('--detail-tooltip-left', tooltipPosition.x + 'px');
      this.fighterTooltip.style.setProperty('--detail-tooltip-top', tooltipPosition.y + 'px');

      this.context.globalAlpha = 0.5;
      this.context.fillStyle = 'cyan';

      this.context.beginPath();
      this.context.arc(fighter.x + this.mapService.tilePixelSize / 2, fighter.y + this.mapService.tilePixelSize / 2,
        fighter.attackRange * this.mapService.tilePixelSize, 0, 2 * Math.PI);
      this.context.stroke();

      this.context.fillStyle = 'black';
      this.context.globalAlpha = 1;
    }
  }

  getTooltipPosition(targetPosition: Vector): Vector {
    return new Vector((targetPosition.x + this.mapService.tilePixelSize) * this.transform.k + this.transform.x,
                      targetPosition.y * this.transform.k + this.transform.y - this.tileTooltip.clientHeight);
  }

  drawTile(position: Vector, imageName: string, scale: number = 1, healthRatio: number = 1) {
    const imageElements = this.mapService.imageElements;
    const image = imageElements[imageName] ? imageElements[imageName] : imageElements['placeholder'];

    this.context.drawImage(image, position.x, position.y, this.mapService.tilePixelSize * scale, this.mapService.tilePixelSize * scale);

    if (healthRatio > 0 && healthRatio < 1) {
      this.context.fillStyle = 'red';
      this.context.fillRect(position.x, position.y + this.mapService.tilePixelSize, this.mapService.tilePixelSize  * healthRatio, -2);
      this.context.fillStyle = 'black';
      this.context.strokeRect(position.x, position.y + this.mapService.tilePixelSize, this.mapService.tilePixelSize, -2);
    }
  }

  get transform() {
    return this.mapService.transform;
  }

  set transform(value) {
    this.mapService.transform = value;
  }

  get canvasPixelWidth(): number {
    return this.mapService.canvasPixelWidth;
  }

  set canvasPixelWidth(value: number) {
    this.mapService.canvasPixelWidth = value;
  }

  get canvasPixelHeight(): number {
    return this.mapService.canvasPixelHeight;
  }

  set canvasPixelHeight(value: number) {
    this.mapService.canvasPixelHeight = value;
  }
}
