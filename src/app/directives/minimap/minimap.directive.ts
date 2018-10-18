import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { MapTileType, BuildingTileType } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { Vector } from 'src/app/objects/vector';

declare var d3: any;

@Directive({
  selector: '[appMinimap]'
})
export class MinimapDirective implements AfterViewInit {
  backgroundCanvas;
  foregroundCanvas;
  backgroundContext: CanvasRenderingContext2D;
  foregroundContext: CanvasRenderingContext2D;

  canvasContainer: Element;

  refreshTimer;

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected mapService: MapService) {
  }

  ngAfterViewInit() {
    this.backgroundCanvas = d3.select('canvas#minimap_background');
    this.foregroundCanvas = d3.select('canvas#minimap_foreground');

    this.backgroundContext = this.backgroundCanvas.node().getContext('2d');
    this.foregroundContext = this.foregroundCanvas.node().getContext('2d');

    this.canvasContainer = document.getElementById('minimap-canvas-container');

    this.renderMinimapBackground();
    this.mapService.onMapUpdate.subscribe(_ => this.renderMinimapBackground());

    this.foregroundCanvas.call(d3.zoom()
    .filter(this.scrollFilter(this))
    .scaleExtent([1, 5])
    .translateExtent([[0, 0], [this.mapService.chunkWidth * this.mapService.tilePixelSize  * this.mapService.totalChunkX,
                               this.mapService.chunkHeight * this.mapService.tilePixelSize * this.mapService.totalChunkY]])
    .on('zoom', this.zoomed(this)));

  this.foregroundCanvas.on('mousedown mousemove', this.clickTile(this));

  this.refreshTimer = d3.interval(this.renderMinimapForeground(this), 25);
  }

  scrollFilter(self: MinimapDirective) {
    return function(elapsed) {
      return d3.event.type !== 'dblclick' && (d3.event.type !== 'mousedown' || d3.event.button === 2);
    };
  }

  zoomed(self: MinimapDirective) {
    return function(elapsed) {
    };
  }

  clickTile(self: MinimapDirective) {
    return function(elapsed) {
      if (!d3.event.buttons) {
        return;
      }

      const coordinates = d3.mouse(this);

      coordinates[0] *= -self.mapService.tilePixelSize * self.transform.k;
      coordinates[1] *= -self.mapService.tilePixelSize * self.transform.k;

      self.mapService.setCameraCenter(new Vector(coordinates[0], coordinates[1]));
    };
  }

  renderMinimapBackground() {
    if (!this.backgroundCanvas) {
      return;
    }

    this.backgroundCanvas.attr('width', this.canvasContainer.clientWidth);
    this.backgroundCanvas.attr('height', this.canvasContainer.clientHeight);

    for (const tile of this.mapService.tileMap) {
      if (!tile) {
        continue;
      }

      const biome = this.mapService.getBiome(tile.noiseValue);

      switch (biome) {
        case MapTileType.Water: {
          this.backgroundContext.fillStyle = 'aqua';
          break;
        } case MapTileType.Grass: {
          this.backgroundContext.fillStyle = `rgb(${200 * tile.noiseValue}, 255, ${200 * tile.noiseValue})`;
          break;
        } case MapTileType.Mountain: {
          this.backgroundContext.fillStyle = `rgb(${100 * tile.noiseValue}, ${100 * tile.noiseValue}, ${100 * tile.noiseValue})`;
        }
      }

      this.backgroundContext.fillRect(tile.x / this.mapService.tilePixelSize, tile.y / this.mapService.tilePixelSize, 1, 1);
    }
  }

  renderMinimapForeground(self: MinimapDirective) {
    return function(elapsed) {
      if (!self.foregroundCanvas) {
        return;
      }

      self.foregroundCanvas.attr('width', self.canvasContainer.clientWidth);
      self.foregroundCanvas.attr('height', self.canvasContainer.clientHeight);

      const homeTile = self.mapService.tileMap.find(tile => tile && tile.buildingTileType === BuildingTileType.Home);

      self.foregroundContext.clearRect(0, 0, self.element.nativeElement.width, self.element.nativeElement.height);

      if (homeTile) {
      const homeImage = self.mapService.imageElements['home'];
      self.foregroundContext.drawImage(homeImage, homeTile.x / self.mapService.tilePixelSize - 8,
                                        homeTile.y / self.mapService.tilePixelSize - 8, 16, 16);
      }

      const mapCameraBounds = self.mapService.getMapCameraBounds();

      self.foregroundContext.fillStyle = 'gray';
      self.foregroundContext.globalAlpha = 0.5;

      self.foregroundContext.strokeRect(mapCameraBounds[0].x / self.mapService.tilePixelSize,
                                        mapCameraBounds[0].y / self.mapService.tilePixelSize,
                                       (mapCameraBounds[1].x - mapCameraBounds[0].x) / self.mapService.tilePixelSize,
                                       (mapCameraBounds[1].y - mapCameraBounds[0].y) / self.mapService.tilePixelSize);

      self.foregroundContext.fillStyle = 'violet';

      self.foregroundContext.fillRect(mapCameraBounds[0].x / self.mapService.tilePixelSize,
                                      mapCameraBounds[0].y / self.mapService.tilePixelSize,
                                     (mapCameraBounds[1].x - mapCameraBounds[0].x) / self.mapService.tilePixelSize,
                                     (mapCameraBounds[1].y - mapCameraBounds[0].y) / self.mapService.tilePixelSize);
    };
  }

  get transform() {
    return this.mapService.transform;
  }

  set transform(value) {
    this.mapService.transform = value;
  }
}
