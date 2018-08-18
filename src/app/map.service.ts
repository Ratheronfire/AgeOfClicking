import { Injectable } from '@angular/core';
import { Tile, TileType } from './tile';

import * as baseMap from '../assets/json/map.json';
const Jimp = require('jimp');

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public tileMap: Tile[][] = []; // = baseMap.default;
  public tileSprites = { };

  walkableTiles = [TileType.Grass];

  playerTileLocation = [5, 5];
  playerTile: Tile;

  constructor() {
    this.tileSprites[TileType.Grass] = '../assets/sprites/grass.png';
    this.tileSprites[TileType.Water] = '../assets/sprites/water.png';
    this.tileSprites[TileType.Mountain] = '../assets/sprites/mountain.png';
    this.tileSprites[TileType.Player] = '../assets/sprites/player.png';

    Jimp.read('../assets/sprites/map.png', (err, mapImage) => {
      if (err) {
        throw err;
      }

      let tileRow = [];

      const colorValues = {
        '1565637887': TileType.Water,
        '1436510719': TileType.Grass,
        '1079469055': TileType.Mountain,
        '4285137151': TileType.Player
      };

      for (let j = 0; j < mapImage.bitmap.width; j++) {
        for (let i = 0; i < mapImage.bitmap.height; i++) {
          let tileType = colorValues[mapImage.getPixelColor(i, j)];

          if (tileType === TileType.Player) {
            tileType = TileType.Grass;
            this.playerTileLocation = [j, i];
          }

          tileRow.push({'tileType': tileType});
        }

        this.tileMap.push(tileRow);
        tileRow = [];
      }

      this.playerTile = this.tileMap[this.playerTileLocation[0]][this.playerTileLocation[1]];
    });
  }

  getRowCount(): number {
    return this.tileMap.length;
  }

  getColumnCount(): number {
    return this.tileMap[0].length;
  }

  getMap(clampToWindow: boolean, topLeft: number[] = [], windowSize: number[] = []): Tile[][] {
    if (!clampToWindow) {
      return this.tileMap;
    }

    const submap = this.tileMap.slice(topLeft[0], topLeft[0] + windowSize[0]);
    for (const i of Object.keys(submap)) {
      const subrow = submap[i];

      submap[i] = subrow.slice(topLeft[1], topLeft[1] + windowSize[1]);
    }

    return submap;
  }

  getTileSprite(tile: Tile) {
    if (tile === this.playerTile) {
      return this.tileSprites[TileType.Player];
    }

    return this.tileSprites[tile.tileType];
  }

  canMove(newLocation: number[]): boolean {
    return newLocation[0] >= 0 && newLocation[0] < this.tileMap.length &&
           newLocation[1] >= 0 && newLocation[1] < this.tileMap[0].length &&
           this.walkableTiles.some(tileType => tileType === this.tileMap[newLocation[0]][newLocation[1]].tileType);
  }

  getPlayerLocation(): number[] {
    return this.playerTileLocation;
  }

  setPlayerLocation(xOffset: number, yOffset: number): boolean {
    const newLocation = [this.playerTileLocation[0] + yOffset, this.playerTileLocation[1] + xOffset];

    if (!this.canMove(newLocation)) {
      return false;
    }

    this.playerTileLocation = newLocation;
    this.playerTile = this.tileMap[newLocation[0]][newLocation[1]];

    return true;
  }
}
