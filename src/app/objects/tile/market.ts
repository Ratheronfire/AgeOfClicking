import { GameService } from './../../game/game.service';
import { Resource } from '../resource';
import { ResourceType } from '../resourceData';
import { BuildingNode } from './buildingNode';
import { BuildingTileType, TileStat } from './tile';

export class Market {
  homeTile: Phaser.Tilemaps.Tile;
  owningTile: Phaser.Tilemaps.Tile;
  tilePath: Phaser.Tilemaps.Tile[];

  soldResources: Resource[];
  currentResource = 0;
  recentSales: number[] = [];

  recentWindowSize = 20;
  timeSinceLastSale = 0;

  lastSellTime = 0;
  sellInterval = 1000;
  sellQuantity = 50;

  game: GameService;

  public constructor(resourceType: ResourceType, owningTile: Phaser.Tilemaps.Tile, shouldInitStats: boolean, game: GameService) {
    const buildingNode: BuildingNode = owningTile.properties['buildingNode'];
    this.game = game;

    if (shouldInitStats) {
      buildingNode.statLevels[TileStat.SellAmount] = 1;
      buildingNode.statLevels[TileStat.SellRate] = 1;
      buildingNode.statCosts[TileStat.SellAmount] = 1500;
      buildingNode.statCosts[TileStat.SellRate] = 1500;
    }

    this.soldResources = game.resources.getResources(resourceType);

    this.homeTile = game.map.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);
    this.owningTile = owningTile;

    this.calculateConnection();
  }

  public tick(elapsed: number, deltaTime: number) {
    if (this.tilePath.length && elapsed - this.lastSellTime > this.sellInterval) {
      this.timeSinceLastSale += deltaTime;

      const resource = this.soldResources[this.currentResource];
      const sellAmount = Math.min(this.sellQuantity, resource.amount - resource.autoSellCutoff);

      if (sellAmount > 0) {
        this.lastSellTime = elapsed;
        this.timeSinceLastSale = 0;

        this.game.map.spawnSoldResourceAnimation(resource.resourceEnum, sellAmount, this);
        resource.addAmount(-sellAmount);

        this.logSale(sellAmount * resource.sellsFor);
      }

      if (this.timeSinceLastSale >= 1000) {
        this.logSale(0);
        this.timeSinceLastSale = 0;
      }

      do {
        this.currentResource = (this.currentResource + 1) % this.soldResources.length;
      } while (!this.soldResources[this.currentResource].sellable);
    }
  }

  logSale(profit: number) {
    this.recentSales.push(profit);

    if (this.recentSales.length >= this.recentWindowSize) {
      this.recentSales = this.recentSales.slice(1, this.recentWindowSize);
    }
  }

  public calculateConnection() {
    this.game.map.findPath(this.homeTile, this.owningTile, true, true).subscribe(path => {
      this.tilePath = path;
    });
  }

  public get averageRecentProfit(): number {
    if (!this.recentSales.length) {
      return 0;
    }
    return this.recentSales.reduce((total, sale) => total += sale) / this.recentSales.length;
  }
}
