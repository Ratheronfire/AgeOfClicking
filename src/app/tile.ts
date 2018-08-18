export enum TileType {
  Grass = 'GRASS',
  Water = 'WATER',
  Mountain = 'MOUNTAIN',
  Player = 'PLAYER'
}

export class Tile {
  tileType: TileType;
}
