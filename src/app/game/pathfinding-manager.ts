import { Observable, of } from 'rxjs';
import TinyQueue from 'tinyqueue';
import { BuildingNode } from '../objects/tile/buildingNode';
import { Market } from '../objects/tile/market';
import { ResourceNode } from '../objects/tile/resourceNode';
import { BuildingTileData, BuildingTileType, MapTileType } from '../objects/tile/tile';
import { GameService } from './game.service';

export class PathfindingManager {
  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  updatePaths(updatedTile: Phaser.Tilemaps.Tile, onlyPathable: boolean) {
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
            (!onlyPathable || ((buildingTile && buildingTile.resourcePathable)) || neighbor.properties['resourceNode'])) {
          tileQueue.push(neighbor);
        }
      }

      const resourceNode: ResourceNode = currentTile.properties['resourceNode'];
      const buildingNode: BuildingNode = currentTile.properties['buildingNode'];

      if (resourceNode) {
        this.findPath(currentTile, homeTile, false, true).subscribe(tilePath => {
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
      this.findPath(resourceTile, homeTile, false, true).subscribe(tilePath => {
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
      onlyPathable: boolean, onlyWalkable: boolean, maxAttempts: number = Infinity): Observable<Phaser.Tilemaps.Tile[]> {
    const tileDistances = {};

    const tileFrom = {};

    const tileQueue = new TinyQueue([], function(a, b) { return a.priority - b.priority; });

    tileDistances[startTile.properties['id']] = 0;
    tileQueue.push({tile: startTile, priority: 0});

    let currentNode;
    let iteration = 0;

    while (tileQueue.length && iteration < maxAttempts) {
      iteration++;

      currentNode = tileQueue.pop();

      if (currentNode === targetTile) {
        break;
      }

      for (const neighborTile of this.game.map.getNeighborTiles(currentNode.tile)) {
        const pathable = this.game.map.isTilePathable(neighborTile);
        const walkable = this.game.map.isTileWalkable(neighborTile);

        if ((onlyPathable && !pathable) || (onlyWalkable && !walkable)) {
          continue;
        }

        const newCost = tileDistances[currentNode.tile.properties['id']] + this.getTileWeight(neighborTile);

        if (!(neighborTile.properties['id'] in tileFrom) || newCost < tileDistances[neighborTile.properties['id']]) {
          tileDistances[neighborTile.properties['id']] = newCost;
          const priority = newCost + this.getHeuristicDistance(neighborTile, targetTile);

          tileQueue.push({tile: neighborTile, priority: priority});
          tileFrom[neighborTile.properties['id']] = currentNode.tile;
        }
      }
    }

    if (!(targetTile.properties['id'] in tileFrom)) {
      return of([]);
    }

    currentNode = targetTile;
    const tilePath = [];
    do {
      tilePath.push(currentNode);
      currentNode = tileFrom[currentNode.properties['id']];
    } while (currentNode !== startTile);

    return of(tilePath.reverse());
  }

  debugDrawGraph(topLeftX: number, topLeftY: number, tileDistances: {}) {
    const tileTable = [];

    for (let i = 0; i < 20; i++) {
      tileTable[i] = [];

      for (let j = 0; j < 20; j++) {
        const tile = this.game.map.getMapTile(topLeftX + i, topLeftY + j);
        tileTable[i][j] = tile ? tileDistances[tile.properties['id']] : undefined;
      }
    }

    console.table(tileTable);
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
