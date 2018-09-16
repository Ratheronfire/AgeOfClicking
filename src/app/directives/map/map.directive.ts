import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { Entity } from '../../objects/entity';
import { Tile, ResourceTile, BuildingTile } from '../../objects/tile';
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

  imageElements = {};

  transform = d3.zoomIdentity;
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
    this.canvas = d3.select('canvas');
    this.context = this.canvas.node().getContext('2d');
    this.canvasContainer = document.getElementById('canvas-container');

    this.tileTooltip = document.getElementById('tile-tooltip');
    this.fighterTooltip = document.getElementById('fighter-tooltip');

    const imageElementContainer = document.getElementById('tile-images');
    for (let i = 0; i < imageElementContainer.children.length; i++) {
      const imageElement = imageElementContainer.children[i];
      this.imageElements[imageElement.id] = imageElement;
    }

    this.context.font = 'bold 4px Arial';

    this.resizeCanvas();

    this.transform.k = 2;

    this.canvas.call(d3.zoom()
        .filter(this.scrollFilter(this))
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [this.mapService.gridWidth * this.mapService.tilePixelSize,
                                   this.mapService.gridHeight * this.mapService.tilePixelSize]])
        .on('zoom', this.zoomed(this)));

    this.canvas.on('mousedown mousemove mouseup', this.clickTile(this));

    this.refreshTimer = d3.interval(this.refreshCanvas(this), 25);
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

      const tile = self.mapService.tiledMap[coordinates[0] + coordinates[1] * self.mapService.mapWidth];

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
    const focusedTile = this.mapService.tiledMap[coordinates[0] + coordinates[1] * this.mapService.mapWidth];

    if (focusedTile.buildingTileType || focusedTile.resourceTileType) {
      this.mapService.focusedTile = focusedTile;
      this.mapService.focusedBuildingTile = this.mapService.buildingTiles[focusedTile.buildingTileType];
      this.mapService.focusedResourceTile = this.mapService.resourceTiles[focusedTile.resourceTileType];
      this.mapService.focusedResources = this.mapService.focusedResourceTile ?
        this.mapService.focusedResourceTile.resourceIds.map(id => this.resourcesService.getResource(id)) : undefined;
    } else {
      this.mapService.focusedTile = undefined;
      this.mapService.focusedBuildingTile = undefined;
      this.mapService.focusedResourceTile = undefined;
      this.mapService.focusedResources = undefined;
    }
  }

  updateFighterTooltip(coordinates: number[]) {
    const focusedTile = this.mapService.tiledMap[coordinates[0] + coordinates[1] * this.mapService.mapWidth];
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
    this.mapService.canvasPixelWidth = this.canvasContainer.clientWidth;
    this.mapService.canvasPixelHeight = window.innerHeight - this.headerPixels;
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
      self.context.clearRect(0, 0, self.mapService.canvasPixelWidth, self.mapService.canvasPixelHeight);
      self.context.translate(self.transform.x, self.transform.y);
      self.context.scale(self.transform.k, self.transform.k);
      self.drawCanvas();
      self.context.restore();
    };
  }

  drawCanvas() {
    const upperLeftPixel = [(-this.transform.x - this.mapService.tilePixelSize * 5) / this.transform.k,
                            (-this.transform.y - this.mapService.tilePixelSize * 5) / this.transform.k];
    const lowerRightPixel =
      [upperLeftPixel[0] + (this.mapService.canvasPixelWidth + this.mapService.tilePixelSize * 5) / this.transform.k,
      upperLeftPixel[1] + (this.mapService.canvasPixelHeight + this.mapService.tilePixelSize * 5) / this.transform.k];

    for (const tile of this.mapService.tiledMap) {
      if (tile.x < upperLeftPixel[0] || tile.x > lowerRightPixel[0] ||
          tile.y < upperLeftPixel[1] || tile.y > lowerRightPixel[1]) {
        continue;
      }

      const mapTileImage = this.imageElements[tile.mapTileType.toLowerCase()];
      this.drawTile(tile.position, mapTileImage);

      if (tile.buildingTileType) {
        const buildingTileImage = this.imageElements[tile.buildingTileType.toLowerCase()];
        this.drawTile(tile.position, buildingTileImage);
      }

      if (tile.resourceTileType) {
        const resourceTileImage = this.imageElements[tile.resourceTileType.toLowerCase().replace(' ', '-')];
        this.drawTile(tile.position, resourceTileImage, 1, tile.health / tile.maxHealth);
      }

      if (tile.health === 0) {
        this.context.globalAlpha = 0.5;
        this.drawTile(tile.position, this.imageElements['disabled']);
        this.context.globalAlpha = 1;
      } else if (tile.buildingTileType && !tile.buildingRemovable && this.mapService.cursorTool === CursorTool.ClearBuildings) {
        this.context.globalAlpha = 0.5;
        this.drawTile(tile.position, this.imageElements['locked']);
        this.context.globalAlpha = 1;
      }
    }

    for (const resourceAnimation of this.mapService.resourceAnimations) {
      const resourceTileImage = this.imageElements[
          this.resourcesService.getResource(resourceAnimation.resourceId).name.toLowerCase().replace(' ', '-')];
      this.context.drawImage(resourceTileImage, resourceAnimation.x, resourceAnimation.y,
          this.mapService.tilePixelSize / 2, this.mapService.tilePixelSize / 2);
        this.drawTile(resourceAnimation.position, resourceTileImage, 0.5);

      this.context.fillStyle = resourceAnimation.spawnedByPlayer ?
        this.settingsService.harvestDetailColor : this.settingsService.workerDetailColor;

      this.context.fillText(Math.floor(resourceAnimation.multiplier).toString(),
        resourceAnimation.x + this.mapService.tilePixelSize / 2, resourceAnimation.y + this.mapService.tilePixelSize / 2);
    }

    for (const enemy of this.enemyService.enemies) {
      const enemyTileImage = this.imageElements[enemy.name.toLowerCase().replace(' ', '-')];
      this.context.drawImage(enemyTileImage, enemy.x, enemy.y, this.mapService.tilePixelSize, this.mapService.tilePixelSize);
      this.drawTile(enemy.position, enemyTileImage, 1, enemy.health / enemy.maxHealth);
    }

    for (const fighter of this.fighterService.fighters) {
      const fighterTileImage = this.imageElements[fighter.name.toLowerCase().replace(' ', '-')];
      this.context.drawImage(fighterTileImage, fighter.x, fighter.y, this.mapService.tilePixelSize, this.mapService.tilePixelSize);
      this.drawTile(fighter.position, fighterTileImage, 1, fighter.health / fighter.maxHealth);
    }

    for (const projectile of this.mapService.projectiles) {
      const projectileTileImage = this.imageElements[projectile.name.toLowerCase().replace(' ', '-')];

      this.context.translate(projectile.x, projectile.y);
      this.context.rotate(projectile.rotation);
      this.context.drawImage(projectileTileImage, -this.mapService.tilePixelSize / 2, -this.mapService.tilePixelSize / 2,
                             this.mapService.tilePixelSize, this.mapService.tilePixelSize);
      this.drawTile(new Vector(-this.mapService.tilePixelSize / 2, -this.mapService.tilePixelSize / 2), projectileTileImage);
      this.context.rotate(-projectile.rotation);
      this.context.translate(-projectile.x, -projectile.y);
    }

    if (this.mapService.focusedTile) {
      const tooltipPosition = this.getTooltipPosition(this.mapService.focusedTile.position);
      this.tileTooltip.style.setProperty('--detail-tooltip-top', tooltipPosition.x + 'px');
      this.tileTooltip.style.setProperty('--detail-tooltip-left', tooltipPosition.y + 'px');

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
      this.fighterTooltip.style.setProperty('--detail-tooltip-top', tooltipPosition.x + 'px');
      this.fighterTooltip.style.setProperty('--detail-tooltip-left', tooltipPosition.y + 'px');

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
    const mapBounds = this.element.nativeElement.getBoundingClientRect();

    return new Vector(targetPosition.y * this.transform.k + this.transform.y - this.tileTooltip.clientHeight,
      (targetPosition.x + this.mapService.tilePixelSize) * this.transform.k + this.transform.x + mapBounds.left);
  }

  drawTile(position: Vector, image: HTMLImageElement, scale: number = 1, healthRatio: number = 1) {
    this.context.drawImage(image, position.x, position.y, this.mapService.tilePixelSize * scale, this.mapService.tilePixelSize * scale);

    if (healthRatio > 0 && healthRatio < 1) {
      this.context.fillStyle = 'red';
      this.context.fillRect(position.x, position.y + this.mapService.tilePixelSize, this.mapService.tilePixelSize  * healthRatio, -2);
      this.context.fillStyle = 'black';
      this.context.strokeRect(position.x, position.y + this.mapService.tilePixelSize, this.mapService.tilePixelSize, -2);
    }
  }
}
