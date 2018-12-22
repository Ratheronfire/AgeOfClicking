import { js as EasyStar } from 'easystarjs';
import { Observable, of } from 'rxjs';
import TinyQueue from 'tinyqueue';
import { BuildingNode } from '../objects/tile/buildingNode';
import { Market } from '../objects/tile/market';
import { ResourceNode } from '../objects/tile/resourceNode';
import { BuildingTileData, BuildingTileType, MapTileType } from '../objects/tile/tile';
import { GameService } from './game.service';

export class PathfindingManager {
  private game: GameService;
  private easyStar: EasyStar;

  constructor(game: GameService) {
    this.game = game;
  }

  init() {
    this.easyStar = new EasyStar();

    this.setGrid();

    this.easyStar.setAcceptableTiles([1, 5]);
    this.easyStar.setTileCost(1, 1);
    this.easyStar.setTileCost(5, 5);
  }

  tick(elapsed: number, deltaTime: number) {
    if (this.easyStar) {
      this.easyStar.calculate();
    }
  }

  setGrid() {
    const mapArray: number[][] = [];
    for (let i = 0; i < this.game.map.mapHeight; i++) {
      mapArray[i] = [];
      for (let j = 0; j < this.game.map.mapWidth; j++) {
        const tile = this.game.map.mapLayer.getTileAt(j, i);

        if (!this.game.map.isTileWalkable(tile)) {
          mapArray[i][j] = 0;
        } else {
          mapArray[i][j] = this.getTileWeight(tile);
        }
      }
    }

    this.easyStar.setGrid(mapArray);
  }

  /** Update pathfinding data for all resource nodes connected to a tile. */
  updatePaths(updatedTile: Phaser.Tilemaps.Tile) {
    const visitedTiles: Phaser.Tilemaps.Tile[] = [];
    const tileQueue: Phaser.Tilemaps.Tile[] = [];
    let currentTile: Phaser.Tilemaps.Tile;

    tileQueue.push(updatedTile);

    const homeTile = this.game.map.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);

    while (tileQueue.length) {
      currentTile = tileQueue.pop();

      const neighborTiles = this.game.map.getNeighborTiles(currentTile);
      visitedTiles.push(currentTile);

      for (const neighbor of neighborTiles) {
        let buildingTile: BuildingTileData;
        if (neighbor.properties['buildingNode']) {
          buildingTile = this.game.map.buildingTileData.get(neighbor.properties['buildingNode'].tileType);
        }

        if (!visitedTiles.includes(neighbor) &&
            ((buildingTile && buildingTile.resourcePathable) || neighbor.properties['resourceNode'])) {
          tileQueue.push(neighbor);
        }
      }

      const resourceNode: ResourceNode = currentTile.properties['resourceNode'];
      const buildingNode: BuildingNode = currentTile.properties['buildingNode'];

      if (resourceNode) {
        this.findPath(currentTile, homeTile, tilePath => {
          resourceNode.path = tilePath;
          const pathAvailable = resourceNode.path.length > 0;

          const resources = this.game.map.resourceTileData.get(resourceNode.tileType).resourceEnums
              .map(resourceEnum => this.game.resources.getResource(resourceEnum));

          for (const resource of resources) {
            const alternatePaths = this.game.map.getResourceTiles(resource.resourceEnum).filter(
              tile => tile !== currentTile && tile.properties['resourceNode'].path.length);
            resource.pathAvailable = pathAvailable || alternatePaths.length > 0;
          }
        });
      } else if (buildingNode && buildingNode instanceof Market) {
        buildingNode.calculateConnection();
      }
    }
  }

  calculateResourceConnections() {
    const resourceTiles = this.game.map.getResourceTiles();

    for (const resource of this.game.resources.allResources) {
      resource.pathAvailable = false;
    }

    const homeTile = this.game.map.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);

    for (const resourceTile of resourceTiles) {
      this.findPath(resourceTile, homeTile, tilePath => {
        const resourceNode = resourceTile.properties['resourceNode'];
        resourceNode.path = tilePath;

        if (resourceNode.path.length && !resourceNode.path.some(tile => tile.health <= 0)) {
          const resources = this.game.map.resourceTileData.get(resourceNode.tileType).resourceEnums
            .map(resourceEnum => this.game.resources.getResource(resourceEnum));
          for (const resource of resources) {
            resource.pathAvailable = true;
          }
        }
      });
    }

    for (const marketTile of this.game.map.mapLayer.getTilesWithin()) {
      const buildingNode: BuildingNode = marketTile.properties['buildingNode'];
      if (buildingNode && buildingNode instanceof Market) {
        buildingNode.calculateConnection();
      }
    }
  }

  findPath(startTile: Phaser.Tilemaps.Tile, targetTile: Phaser.Tilemaps.Tile,
      callback: (tilePath: Phaser.Tilemaps.Tile[]) => void) {
    if (startTile.properties['islandId'] !== targetTile.properties['islandId']) {
      callback([]);
      return;
    }

    this.easyStar.findPath(startTile.x, startTile.y, targetTile.x, targetTile.y, path => {
      if (!path) {
        callback([]);
        return;
      }

      const tilePath = path.map(node => this.game.map.getMapTile(node.x, node.y));

      callback(tilePath);
    });
  }

  getHeuristicDistance(currentTile: Phaser.Tilemaps.Tile, targetTile: Phaser.Tilemaps.Tile): number {
    return Math.abs(targetTile.x - currentTile.x) + Math.abs(targetTile.y - currentTile.y);
  }

  getTileWeight(tile: Phaser.Tilemaps.Tile): number {
    const mapTileType: MapTileType = tile.properties['tileType'];
    const buildingNode: BuildingNode = tile.properties['buildingNode'];
    const buildingData = buildingNode ? this.game.map.buildingTileData.get(buildingNode.tileType) : null;

    if (tile.properties['resourceNode']) {
      return 1;
    } else if (buildingData && buildingNode.health > 0 && buildingData.resourcePathable) {
      return 1;
    } else if ((!buildingNode || buildingNode.health <= 0) && mapTileType === MapTileType.Grass) {
      return 5;
    } else {
      return Infinity;
    }
  }

  getPathWeight(tilePath: Phaser.Tilemaps.Tile[]): number {
    return tilePath.map(tile => this.getTileWeight(tile)).reduce((total, weight) => total += weight);
  }
}
