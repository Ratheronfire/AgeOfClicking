import { AdminService } from './../admin.service';
import { TileType, Tile } from './../tile';
import { MapService } from './../map.service';
import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  tileTypes = TileType;
  tilePixels = 50;

  windowSize = [12, 12];
  topLeft = [0, 0];
  xOffset = 0;
  yOffset = 0;

  constructor(protected mapService: MapService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  @HostListener('document:keypress', ['$event'])
  processMapInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        this.setPlayerLocation(0, -1);
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        this.setPlayerLocation(-1, 0);
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        this.setPlayerLocation(0, 1);
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        this.setPlayerLocation(1, 0);
        break;
    }
  }

  getMap(clampToWindow: boolean): Tile[][] {
    return this.mapService.getMap(clampToWindow, this.topLeft, this.windowSize);
  }

  getTileSprite(tile: Tile) {
    return this.mapService.getTileSprite(tile);
  }

  getPlayerLocation(): number[] {
    return this.mapService.getPlayerLocation();
  }

  setPlayerLocation(xOffset: number, yOffset: number) {
    const moveSuccessful = this.mapService.setPlayerLocation(xOffset, yOffset);

    if (!moveSuccessful) {
      return;
    }

    const playerLocation = this.getPlayerLocation();

    const distanceFromCenter = [Math.abs(playerLocation[0] - (this.topLeft[0] + this.windowSize[0] / 2)),
                                Math.abs(playerLocation[1] - (this.topLeft[1] + this.windowSize[1] / 2))];

    const newCameraX = this.topLeft[1] + xOffset;
    const newCameraY = this.topLeft[0] + yOffset;

    if (newCameraX >= 0 && newCameraX + this.windowSize[1] <= this.getColumnCount() && distanceFromCenter[1] >= 1) {
      this.topLeft[1] = newCameraX;
    }
    if (newCameraY >= 0 && newCameraY + this.windowSize[0] <= this.getRowCount() && distanceFromCenter[0] >= 1) {
      this.topLeft[0] = newCameraY;
    }
  }

  getRowCount(): number {
    return this.mapService.getRowCount();
  }

  getColumnCount(): number {
    return this.mapService.getColumnCount();
  }
}
