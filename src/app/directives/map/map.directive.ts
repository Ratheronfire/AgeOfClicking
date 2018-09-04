import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { Entity } from '../../objects/entity';
import { ResourceTile } from '../../objects/tile';
import { ResourcesService } from './../../services/resources/resources.service';
import { SettingsService } from './../../services/settings/settings.service';
import { EnemyService } from '../../services/enemy/enemy.service';
import { MapService } from './../../services/map/map.service';

declare var d3: any;

@Directive({
  selector: '[appMap]'
})
export class MapDirective implements AfterViewInit {
  canvas;
  context: CanvasRenderingContext2D;
  transform = d3.zoomIdentity;

  lastAnimationTime = 0;
  tileAnimationSpeed = 0.003;
  enemyAnimationSpeed = 0.006;

  refreshTimer;
  lowFramerateActive = false;
  highFramerate = 25;
  lowFramerate = 125;

  tilePixelSize = 16;
  gridWidth = 150;
  gridHeight = 150;
  canvasPixelWidth: number;
  canvasPixelHeight: number;

  images = [{name: 'map', x: 0, y: 0, width: this.gridWidth * this.tilePixelSize, height: this.gridHeight * this.tilePixelSize}];

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected resourcesService: ResourcesService,
              protected settingsService: SettingsService,
              protected enemyService: EnemyService,
              protected mapService: MapService) { }

  ngAfterViewInit() {
    this.canvas = d3.select('canvas');
    this.context = this.canvas.node().getContext('2d');

    this.context.font = 'bold 4px Arial';

    this.canvasPixelWidth = this.canvas.property('width');
    this.canvasPixelHeight = this.canvas.property('height');

    this.canvas.call(d3.zoom()
        .scaleExtent([2 / 3, 5])
        .translateExtent([[0, 0], [this.gridWidth * this.tilePixelSize, this.gridHeight * this.tilePixelSize]])
        .on('zoom', this.zoomed(this)));

    this.canvas.on('click', this.clickTile(this));

    this.refreshTimer = d3.interval(this.updateEntities(this), 25);
  }

  zoomed(self: MapDirective) {
    return function(elapsed) {
      self.transform = d3.event.transform;
      self.refreshCanvas();
    };
  }

  clickTile(self: MapDirective) {
    return function(elapsed) {
      const coordinates = d3.mouse(this);
      coordinates[0] = Math.floor(self.transform.invertX(coordinates[0]) / self.tilePixelSize);
      coordinates[1] = Math.floor(self.transform.invertY(coordinates[1]) / self.tilePixelSize);

      const tile = self.mapService.tiledMap[coordinates[0] + coordinates[1] * self.mapService.mapWidth];

      if (self.mapService.deleteMode) {
        self.mapService.clearBuilding(tile);
      } else {
        self.mapService.createBuilding(tile, self.mapService.selectedBuilding.tileType);
      }

      self.refreshCanvas();
    };
  }

  updateEntities(self: MapDirective) {
    return function(elapsed) {
      if (self.lowFramerateActive !== self.settingsService.mapLowFramerate) {
        self.lowFramerateActive = self.settingsService.mapLowFramerate;

        self.refreshTimer.stop();
        self.refreshTimer = d3.interval(self.updateEntities(self),
          self.lowFramerateActive ? self.lowFramerate : self.highFramerate);
      }

      let deltaTime = elapsed - self.lastAnimationTime;
      if (deltaTime < 0) {
        deltaTime = 0;
      }

      for (const resourceAnimation of self.mapService.resourceAnimations) {
        self.updateEntityPosition(resourceAnimation, self.tileAnimationSpeed, deltaTime);

        if (resourceAnimation.pathingDone) {
          self.resourcesService.finishResourceAnimation(
            resourceAnimation.resourceId, resourceAnimation.multiplier, resourceAnimation.spawnedByPlayer);
        }
      }

      self.mapService.resourceAnimations = self.mapService.resourceAnimations.filter(animation => !animation.pathingDone);

      for (const enemy of self.enemyService.enemies) {
        self.updateEntityPosition(enemy, self.enemyAnimationSpeed, deltaTime);
      }

      self.lastAnimationTime = elapsed;

      self.refreshCanvas();
    };
  }

  updateEntityPosition(entity: Entity, animationSpeed: number, deltaTime: number) {
    if (entity.tilePath === undefined || entity.pathStep >= entity.tilePath.length - 1) {
      return;
    }

    const currentTile = entity.tilePath[entity.pathStep];
    const destinationTile = entity.tilePath[entity.pathStep + 1];

    entity.x += (destinationTile.x - currentTile.x) * deltaTime * animationSpeed;
    entity.y += (destinationTile.y - currentTile.y) * deltaTime * animationSpeed;

    const xOffset = Math.abs(entity.x - currentTile.x);
    const yOffset = Math.abs(entity.y - currentTile.y);

    if (xOffset >= this.tilePixelSize || yOffset >= this.tilePixelSize) {
      entity.pathStep++;

      if (entity.pathStep === entity.tilePath.length - 1) {
          entity.pathingDone = true;
      }
    }
  }

  refreshCanvas() {
    this.context.save();
    this.context.clearRect(0, 0, this.canvasPixelWidth, this.canvasPixelHeight);
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    this.drawCanvas();
    this.context.restore();
  }

  drawCanvas() {
    const upperLeftPixel = [(-this.transform.x - this.tilePixelSize * 5) / this.transform.k,
                            (-this.transform.y - this.tilePixelSize * 5) / this.transform.k];
    const lowerRightPixel = [upperLeftPixel[0] + (this.canvasPixelWidth + this.tilePixelSize * 5) / this.transform.k,
                             upperLeftPixel[1] + (this.canvasPixelHeight + this.tilePixelSize * 5) / this.transform.k];

    for (const tile of this.mapService.tiledMap) {
      if (tile.x < upperLeftPixel[0] || tile.x > lowerRightPixel[0] ||
          tile.y < upperLeftPixel[1] || tile.y > lowerRightPixel[1]) {
        continue;
      }

      const mapTileImage = <HTMLImageElement> document.getElementById(tile.mapTileType.toLowerCase());
      this.context.drawImage(mapTileImage, tile.x, tile.y, this.tilePixelSize, this.tilePixelSize);

      if (tile.resourceTileType) {
        const resourceTileImage = <HTMLImageElement> document.getElementById(tile.resourceTileType.toLowerCase().replace(' ', '-'));
        this.context.drawImage(resourceTileImage, tile.x, tile.y, this.tilePixelSize, this.tilePixelSize);
      }

      if (tile.buildingTileType) {
        const buildingTileImage = <HTMLImageElement> document.getElementById(tile.buildingTileType.toLowerCase());
        this.context.drawImage(buildingTileImage, tile.x, tile.y, this.tilePixelSize, this.tilePixelSize);
      }
    }

    for (const resourceAnimation of this.mapService.resourceAnimations) {
      const resourceTileImage = <HTMLImageElement> document.getElementById(
          this.resourcesService.getResource(resourceAnimation.resourceId).name.toLowerCase().replace(' ', '-'));
      this.context.drawImage(resourceTileImage, resourceAnimation.x, resourceAnimation.y, this.tilePixelSize / 2, this.tilePixelSize / 2);

      if (!this.settingsService.mapDetailMode) {
        continue;
      }

      // if (resourceAnimation.pathStep < resourceAnimation.tilePath.length - 1) {
      //   this.context.beginPath();
      //   this.context.moveTo(resourceAnimation.x, resourceAnimation.y);
      //   this.context.lineTo(resourceAnimation.tilePath[resourceAnimation.pathStep + 1].x,
      //                       resourceAnimation.tilePath[resourceAnimation.pathStep + 1].y);
      //   this.context.stroke();
      // }

      this.context.fillStyle = resourceAnimation.spawnedByPlayer ?
        this.settingsService.harvestDetailColor : this.settingsService.workerDetailColor;

      this.context.fillText(Math.floor(resourceAnimation.multiplier).toString(),
        resourceAnimation.x + this.tilePixelSize / 2, resourceAnimation.y + this.tilePixelSize / 2);
    }

    for (const enemy of this.enemyService.enemies) {
      const enemyTileImage = <HTMLImageElement> document.getElementById(enemy.name.toLowerCase().replace(' ', '-'));
      this.context.drawImage(enemyTileImage, enemy.x, enemy.y, this.tilePixelSize, this.tilePixelSize);

      if (enemy.pathStep < enemy.tilePath.length - 1) {
        this.context.beginPath();
        this.context.moveTo(enemy.x, enemy.y);
        this.context.lineTo(enemy.tilePath[enemy.pathStep + 1].x, enemy.tilePath[enemy.pathStep + 1].y);
        this.context.stroke();
      }
    }

    if (!this.settingsService.mapDetailMode) {
      return;
    }

    for (const tile of this.mapService.getResourceTiles()) {
      this.context.fillStyle = this.settingsService.resourceDetailColor;
      const resourceTile: ResourceTile = this.mapService.resourceTiles[tile.resourceTileType];
      this.context.fillText(resourceTile.name, tile.x + this.tilePixelSize / 2, tile.y - this.tilePixelSize / 4);
    }
  }
}
