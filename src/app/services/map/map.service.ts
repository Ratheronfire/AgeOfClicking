import { Injectable } from '@angular/core';
import { Tile, TileType } from '../../objects/tile';

declare var require: any;
const Jimp = require('jimp');

@Injectable({
  providedIn: 'root'
})
export class MapService {
  public tileSprites = { };
  mapWidth: number;
  mapHeight: number;

  public tiledMap: Tile[] = [];

  walkableTiles = [TileType.Grass];

  playerY = 100;
  playerX = 100;
  playerTile: Tile;

  constructor() {
    this.tileSprites[TileType.Grass] = '../assets/sprites/grass.png';
    this.tileSprites[TileType.Water] = '../assets/sprites/water.png';
    this.tileSprites[TileType.Mountain] = '../assets/sprites/mountain.png';
    this.tileSprites[TileType.Player] = '../assets/sprites/player.png';

    const _tiledMap: Tile[] = [];
    const tileTypes = [TileType.Grass, TileType.Water, TileType.Mountain];
    let _mapWidth: number, _mapHeight: number;

    const xmlRequest = new XMLHttpRequest();
    xmlRequest.onload = function() {
      const xmlDoc = new DOMParser().parseFromString(xmlRequest.responseText, 'text/xml');
      const mapValues = xmlDoc.getElementsByTagName('data')[0].textContent;
      const layerData = xmlDoc.getElementsByTagName('layer')[0];

      _mapWidth = +layerData.attributes.getNamedItem('width').value;
      _mapHeight = +layerData.attributes.getNamedItem('height').value;

      mapValues.split(',').map(tileIndex => _tiledMap.push({tileType: tileTypes[+tileIndex - 1]}));
    };

    xmlRequest.open('GET', '../assets/tilemap/map.tmx', false);
    xmlRequest.send();

    this.tiledMap = _tiledMap;
    this.mapWidth = _mapWidth;
    this.mapHeight = _mapHeight;
  }

  getRowCount(): number {
    return this.mapHeight;
  }

  getColumnCount(): number {
    return this.mapWidth;
  }

  getTile(x: number, y: number) {
    return this.tiledMap[x + y * this.mapWidth];
  }

  getMap(clampToWindow: boolean, topLeftX: number, topLeftY: number, windowWidth: number, windowHeight: number): Tile[] {
    if (!clampToWindow) {
      return this.tiledMap;
    }

    const submap: Tile[] = [];

    for (let i = topLeftY; i < topLeftY + windowHeight; i++) {
      for (let j = topLeftX; j < topLeftX + windowWidth; j++) {
        submap.push(this.getTile(j, i));
      }
    }

    return submap;
  }

  getTileSprite(tile: Tile) {
    if (tile === this.playerTile) {
      return this.tileSprites[TileType.Player];
    }

    return this.tileSprites[tile.tileType];
  }

  canMove(newLocationX: number, newLocationY: number): boolean {
    return newLocationX >= 0 && newLocationX < this.mapWidth &&
           newLocationY >= 0 && newLocationY < this.mapHeight &&
           this.walkableTiles.some(tileType => tileType === this.getTile(newLocationX, newLocationY).tileType);
  }

  getPlayerLocation(): number[] {
    return [this.playerX, this.playerY];
  }

  setPlayerLocation(xOffset: number, yOffset: number): boolean {
    const newLocationX = this.playerX + xOffset;
    const newLocationY = this.playerY + yOffset;

    if (!this.canMove(newLocationX, newLocationY)) {
      return false;
    }

    this.playerX = newLocationX;
    this.playerY = newLocationY;
    this.playerTile = this.getTile(newLocationX, newLocationY);

    return true;
  }
}
