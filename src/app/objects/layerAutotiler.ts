/* tslint:disable:no-bitwise */
import { GameService } from './../game/game.service';

enum Direction {
  Up,
  Down,
  Left,
  Right,
  UpLeft,
  UpRight,
  DownLeft,
  DownRight
}

export class LayerAutotiler {
  private flagsToTilesetIndex = [
    0b00001010, 0b00001100, 0b10001110, 0b01000110, 0b10001010, 0b11001110, 0b01001110, 0b00000110,
    0b00001011, 0b00001110, 0b00101111, 0b10011111, 0b11101111, 0b11111111, 0b01010111, 0b00000011,
    0b10001011, 0b01001111, 0b00001111, 0b10101111, 0b01111111, 0b00111111, 0b00010111, 0b00000001,
    0b00101011, 0b00011111, 0b00000111, 0b10101011, 0b11011111, 0b11001111, 0b01000111, 0b00000010,
    0b00001001, 0b00001101, 0b10001111, 0b01101111, 0b10111111, 0b11111111, 0b01011111, 0b00000101,
    0b00000000, 0b00001000, 0b00101101, 0b00010101, 0b00101001, 0b00111101, 0b00011101, 0b00000100
  ];

  private adjacentFlags: number[];

  private tileValidityTester: (otherTile: Phaser.Tilemaps.Tile, mainTile: Phaser.Tilemaps.Tile) => boolean;
  private getTilesetIndexOffset: (tile: Phaser.Tilemaps.Tile) => number;

  mapLayer: Phaser.Tilemaps.DynamicTilemapLayer;

  hideInvalidTiles: boolean;

  game: GameService;

  constructor(mapLayer: Phaser.Tilemaps.DynamicTilemapLayer, hideInvalidTiles = true, game: GameService,
      tileValidityTester?: (otherTile: Phaser.Tilemaps.Tile, mainTile: Phaser.Tilemaps.Tile) => boolean,
      getTilesetIndexOffset?: (tile: Phaser.Tilemaps.Tile) => number) {
    this.mapLayer = mapLayer;

    this.tileValidityTester = (otherTile, mainTile) => {
      if (!otherTile) {
        return false;
      }

      if (tileValidityTester) {
        return tileValidityTester(otherTile, mainTile);
      } else {
        return true;
      }
    };

    if (getTilesetIndexOffset) {
      this.getTilesetIndexOffset = getTilesetIndexOffset;
    } else {
      this.getTilesetIndexOffset = _ => 0;
    }

    this.hideInvalidTiles = hideInvalidTiles;

    this.adjacentFlags = [];
    this.game = game;

    for (let i = 0; i < this.game.map.mapWidth; i++) {
      for (let j = 0; j < this.game.map.mapHeight; j++) {
        const tile = this.mapLayer.getTileAt(i, j);

        if (tile) {
          this.tileUpdated(tile);
        }
      }
    }
  }

  public tileUpdated(tile: Phaser.Tilemaps.Tile) {
    this.refreshTile(tile.x - 1, tile.y);
    this.refreshTile(tile.x + 1, tile.y);
    this.refreshTile(tile.x, tile.y - 1);
    this.refreshTile(tile.x, tile.y + 1);
    this.refreshTile(tile.x, tile.y);
  }

  private refreshTile(x: number, y: number) {
    const adjacentTiles = this.getAdjacentTiles(x, y);

    this.setTileAdjacentFlags(x, y, adjacentTiles);

    const tile = this.mapLayer.getTileAt(x, y);

    if (tile && this.tileValidityTester(tile, tile)) {
      tile.index = this.getTilesetIndexOffset(tile) + this.flagsToTilesetIndex.indexOf(this.getTileFlagValue(x, y));
    }
  }



  getTileFlagValue(x: number, y: number): number {
    const tileIndex = y * this.mapLayer.width + x;
    return this.adjacentFlags[tileIndex];
  }

  getTileAdjacentFlags(x: number, y: number) {
    const tileIndex = y * this.mapLayer.width + x;
    const tileAdjacentFlags = {};

    tileAdjacentFlags[Direction.Up] =        (this.adjacentFlags[tileIndex] & 1)   > 0;
    tileAdjacentFlags[Direction.Down] =      (this.adjacentFlags[tileIndex] & 2)   > 0;
    tileAdjacentFlags[Direction.Left] =      (this.adjacentFlags[tileIndex] & 4)   > 0;
    tileAdjacentFlags[Direction.Right] =     (this.adjacentFlags[tileIndex] & 8)   > 0;
    tileAdjacentFlags[Direction.UpLeft] =    (this.adjacentFlags[tileIndex] & 16)  > 0;
    tileAdjacentFlags[Direction.UpRight] =   (this.adjacentFlags[tileIndex] & 32)  > 0;
    tileAdjacentFlags[Direction.DownLeft] =  (this.adjacentFlags[tileIndex] & 64)  > 0;
    tileAdjacentFlags[Direction.DownRight] = (this.adjacentFlags[tileIndex] & 128) > 0;

    return tileAdjacentFlags;
  }

  setTileAdjacentFlags(x: number, y: number, adjacentTiles: {}) {
    const tileIndex = y * this.mapLayer.width + x;
    this.adjacentFlags[tileIndex] = 0;

    const tile = this.mapLayer.getTileAt(x, y);
    if (!this.tileValidityTester(tile, tile)) {
      if (tile && this.hideInvalidTiles) {
        tile.visible = false;
      }

      return;
    }

    tile.visible = true;

    const upBit =        (this.tileValidityTester(adjacentTiles[Direction.Up], tile)                               ? 1   : 0);
    const downBit =      (this.tileValidityTester(adjacentTiles[Direction.Down], tile)                             ? 2   : 0);
    const leftBit =      (this.tileValidityTester(adjacentTiles[Direction.Left], tile)                             ? 4   : 0);
    const rightBit =     (this.tileValidityTester(adjacentTiles[Direction.Right], tile)                            ? 8   : 0);
    const upLeftBit =    (upBit &&   leftBit &&  this.tileValidityTester(adjacentTiles[Direction.UpLeft], tile)    ? 16  : 0);
    const upRightBit =   (upBit &&   rightBit && this.tileValidityTester(adjacentTiles[Direction.UpRight], tile)   ? 32  : 0);
    const downLeftBit =  (downBit && leftBit &&  this.tileValidityTester(adjacentTiles[Direction.DownLeft], tile)  ? 64  : 0);
    const downRightBit = (downBit && rightBit && this.tileValidityTester(adjacentTiles[Direction.DownRight], tile) ? 128 : 0);

    this.adjacentFlags[tileIndex] |= upBit;
    this.adjacentFlags[tileIndex] |= downBit;
    this.adjacentFlags[tileIndex] |= leftBit;
    this.adjacentFlags[tileIndex] |= rightBit;
    this.adjacentFlags[tileIndex] |= upLeftBit;
    this.adjacentFlags[tileIndex] |= upRightBit;
    this.adjacentFlags[tileIndex] |= downLeftBit;
    this.adjacentFlags[tileIndex] |= downRightBit;
  }

  private getAdjacentTiles(x: number, y: number) {
    const adjacentTiles = {};

    adjacentTiles[Direction.Up] =        this.mapLayer.getTileAt(x, y - 1);
    adjacentTiles[Direction.Down] =      this.mapLayer.getTileAt(x, y + 1);
    adjacentTiles[Direction.Left] =      this.mapLayer.getTileAt(x - 1, y);
    adjacentTiles[Direction.Right] =     this.mapLayer.getTileAt(x + 1, y);
    adjacentTiles[Direction.UpLeft] =    this.mapLayer.getTileAt(x - 1, y - 1);
    adjacentTiles[Direction.UpRight] =   this.mapLayer.getTileAt(x + 1, y - 1);
    adjacentTiles[Direction.DownLeft] =  this.mapLayer.getTileAt(x - 1, y + 1);
    adjacentTiles[Direction.DownRight] = this.mapLayer.getTileAt(x + 1, y + 1);

    return adjacentTiles;
  }
}
