import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

import { timer } from 'rxjs';

import { ResourceAnimation } from '../../objects/resourceAnimation';
import { ResourcesService } from './../../services/resources/resources.service';
import { MapService } from './../../services/map/map.service';

declare var d3: any;

@Directive({
  selector: '[appMap]'
})
export class MapDirective implements AfterViewInit {
  canvas;
  context: CanvasRenderingContext2D;
  transform = d3.zoomIdentity;

  lastAnimationTime = Date.now();
  tileAnimationSpeed = 0.003;

  width: number;
  height: number;
  images = [{name: 'map', x: 0, y: 0, width: 1600, height: 1600}];

  constructor(protected element: ElementRef,
              protected renderer: Renderer2,
              protected resourcesService: ResourcesService,
              protected mapService: MapService) { }

  ngAfterViewInit() {
    this.canvas = d3.select('canvas');
    this.context = this.canvas.node().getContext('2d');

    this.width = this.canvas.property('width');
    this.height = this.canvas.property('height');

    this.canvas.call(d3.zoom()
        .scaleExtent([1 / 3, 4])
        .translateExtent([[0, 0], [2400, 2400]])
        .on('zoom', this.zoomed(this)));

    this.canvas.on('click', this.clickTile(this));

    d3.timer(this.updateResourceAnimations(this), 125);
  }

  zoomed(self: MapDirective) {
    return function(d) {
      self.transform = d3.event.transform;
      self.refreshCanvas();
    };
  }

  clickTile(self: MapDirective) {
    return function(d) {
      const coordinates = d3.mouse(this);
      coordinates[0] = Math.floor(self.transform.invertX(coordinates[0]) / 16);
      coordinates[1] = Math.floor(self.transform.invertY(coordinates[1]) / 16);

      const tile = self.mapService.tiledMap[coordinates[0] + coordinates[1] * self.mapService.mapWidth];

      if (self.mapService.deleteMode) {
        self.mapService.clearBuilding(tile);
      } else {
        self.mapService.createBuilding(tile, self.mapService.selectedBuilding.tileType);
      }

      self.refreshCanvas();
    };
  }

  updateResourceAnimations(self: MapDirective) {
    return function(d) {
      const deltaTime = Date.now() - self.lastAnimationTime;

      for (const resourceAnimation of self.mapService.resourceAnimations) {
        const currentTile = resourceAnimation.buildingPath[resourceAnimation.pathStep];
        const destinationTile = resourceAnimation.buildingPath[resourceAnimation.pathStep + 1];

        const startPos = [currentTile.x, currentTile.y];
        const endPos = [destinationTile.x, destinationTile.y];

        resourceAnimation.x += (endPos[0] - startPos[0]) * deltaTime * self.tileAnimationSpeed;
        resourceAnimation.y += (endPos[1] - startPos[1]) * deltaTime * self.tileAnimationSpeed;

        if (Math.abs(resourceAnimation.x - currentTile.x) >= 8 ||
            Math.abs(resourceAnimation.y - currentTile.y) >= 8) {
          resourceAnimation.pathStep++;

          if (resourceAnimation.pathStep === resourceAnimation.buildingPath.length - 1) {
            self.resourcesService.finishResourceAnimation(resourceAnimation.resourceId);
            resourceAnimation.done = true;
          }
        }
      }

      self.mapService.resourceAnimations = self.mapService.resourceAnimations.filter(animation => !animation.done);

      self.lastAnimationTime = Date.now();

      self.refreshCanvas();
    };
  }

  refreshCanvas() {
    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    this.drawCanvas();
    this.context.restore();
  }

  drawCanvas() {
    for (const tile of this.mapService.tiledMap) {
      const mapTileImage = <HTMLImageElement> document.getElementById(tile.mapTileType.toLowerCase());
      this.context.drawImage(mapTileImage, tile.x, tile.y, 16, 16);

      if (tile.resourceTileType) {
        const resourceTileImage = <HTMLImageElement> document.getElementById(tile.resourceTileType.toLowerCase());
        this.context.drawImage(resourceTileImage, tile.x, tile.y, 16, 16);
      }

      if (tile.buildingTileType) {
        const buildingTileImage = <HTMLImageElement> document.getElementById(tile.buildingTileType.toLowerCase());
        this.context.drawImage(buildingTileImage, tile.x, tile.y, 16, 16);
      }
    }

    for (const resourceAnimation of this.mapService.resourceAnimations) {
      const resourceTileImage = <HTMLImageElement> document.getElementById(
          this.resourcesService.getResource(resourceAnimation.resourceId).name.toLowerCase().replace(' ', '-'));
      this.context.drawImage(resourceTileImage, resourceAnimation.x, resourceAnimation.y, 8, 8);
    }
  }
}
