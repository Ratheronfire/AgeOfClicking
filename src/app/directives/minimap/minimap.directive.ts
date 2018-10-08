import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { MapTileType, BuildingTileType } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';

declare var d3: any;

@Directive({
  selector: '[appMinimap]'
})
export class MinimapDirective implements AfterViewInit {
  canvas;
  context: CanvasRenderingContext2D;
  canvasContainer: Element;

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected mapService: MapService) { }

  ngAfterViewInit() {
    this.canvas = d3.select('canvas#minimap');
    this.context = this.canvas.node().getContext('2d');
    this.canvasContainer = document.getElementById('minimap-canvas-container');

    this.renderMinimap();
  }

  renderMinimap() {
    this.element.nativeElement.width = this.canvasContainer.clientWidth;
    this.element.nativeElement.height = this.canvasContainer.clientHeight;

    for (const tile of this.mapService.tileMap) {
      if (!tile) {
        continue;
      }

      const biome = this.mapService.getBiome(tile.noiseValue);

      switch (biome) {
        case MapTileType.Water: {
          this.context.fillStyle = 'aqua';
          break;
        } case MapTileType.Grass: {
          this.context.fillStyle = `rgb(${200 * tile.noiseValue}, 255, ${200 * tile.noiseValue})`;
          break;
        } case MapTileType.Mountain: {
          this.context.fillStyle = `rgb(${100 * tile.noiseValue}, ${100 * tile.noiseValue}, ${100 * tile.noiseValue})`;
        }
      }

      this.context.fillRect(tile.x / this.mapService.tilePixelSize, tile.y / this.mapService.tilePixelSize, 1, 1);
    }

    const homeTile = this.mapService.tileMap.find(tile => tile && tile.buildingTileType === BuildingTileType.Home);
    this.context.fillRect(homeTile.x, homeTile.y, this.mapService.tilePixelSize, this.mapService.tilePixelSize);
  }
}
