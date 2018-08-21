import { AdminService } from '../../services/admin/admin.service';
import { TileType, Tile } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  tileTypes = TileType;
  tilePixels = 48;

  topLeftX = 0;
  topLeftY = 0;
  windowWidth = 15;
  windowHeight = 15;

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

  getMap(clampToWindow: boolean): Tile[] {
    return this.mapService.getMap(clampToWindow, this.topLeftX, this.topLeftY, this.windowWidth, this.windowHeight);
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

    this.topLeftX = Math.floor(this.mapService.playerX - this.windowWidth / 2);
    this.topLeftY = Math.floor(this.mapService.playerY - this.windowHeight / 2);

    if (this.topLeftX < 0) {
      this.topLeftX = 0;
    } else if (this.topLeftX + this.windowWidth > this.mapService.mapWidth) {
      this.topLeftX = this.mapService.mapWidth - this.windowWidth;
    }
    if (this.topLeftY < 0) {
      this.topLeftY = 0;
    } else if (this.topLeftY + this.windowHeight > this.mapService.mapHeight) {
      this.topLeftY = this.mapService.mapHeight - this.windowHeight;
    }

    const playerLocation = this.getPlayerLocation();

    const distanceFromCenterX = Math.abs(playerLocation[0] - (this.topLeftX + this.windowWidth / 2));
    const distanceFromCenterY = Math.abs(playerLocation[1] - (this.topLeftY + this.windowHeight / 2));

    const newCameraX = this.topLeftX + xOffset;
    const newCameraY = this.topLeftY + yOffset;

    if (newCameraX >= 0 && newCameraX + this.windowWidth <= this.getColumnCount() && distanceFromCenterX >= 1) {
      this.topLeftX = newCameraX;
    }
    if (newCameraY >= 0 && newCameraY + this.windowHeight <= this.getRowCount() && distanceFromCenterY >= 1) {
      this.topLeftY = newCameraY;
    }
  }

  getRowCount(): number {
    return this.mapService.getRowCount();
  }

  getColumnCount(): number {
    return this.mapService.getColumnCount();
  }
}
