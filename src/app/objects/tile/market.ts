import { Resource } from '../resource';
import { ResourceType } from '../resourceData';
import { GameService } from './../../game/game.service';
import { BuildingNode, TileStats } from './buildingNode';
import { BuildingTileData, BuildingTileType, TileStat } from './tile';

export const marketBuildingTypes = {
  'MINERAL': BuildingTileType.MineralMarket,
  'METAL': BuildingTileType.MetalMarket,
  'WOOD': BuildingTileType.WoodMarket
};

export class MarketStats extends TileStats {
  owner: Market;

  public getStatString(stat: TileStat): string {
    switch (stat) {
      case TileStat.SellAmount: {
        return `Sell Amount: ${Math.floor(this.getStat(stat))} Items/Sale`;
      } case TileStat.SellRate: {
        return `Sell Rate: ${Math.floor(10000 / this.getStat(stat)) / 10} ${this.getStat(stat) === 1000 ? 'Sale/Second' : 'Sales/Second'}`;
      } default: {
        return super.getStatString(stat);
      }
    }
  }

  public getUpgradedStatString(stat: TileStat): string {
    switch (stat) {
      case TileStat.SellAmount: {
        return `Sell Amount: ${Math.floor(this.getUpgradedStat(stat))} Items/Sale`;
      } case TileStat.SellRate: {
        return `Sell Rate: ${Math.floor(10000 / this.getUpgradedStat(stat)) / 10} Sales/Second`;
      } default: {
        return super.getUpgradedStatString(stat);
      }
    }
  }

  public getStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.SellAmount: {
        return this.owner.sellQuantity;
      } case TileStat.SellRate: {
        return this.owner.sellInterval;
      } default: {
        return super.getStat(stat);
      }
    }
  }

  public getUpgradedStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.SellAmount: {
        return this.owner.sellQuantity * 1.2;
      } case TileStat.SellRate: {
        return this.owner.sellInterval / 1.1;
      } default: {
        return super.getUpgradedStat(stat);
      }
    }
  }

  public upgradeStat(stat: TileStat, upgradeForFree = false) {
    if (!this.canUpgradeStat(stat) && !upgradeForFree) {
      return;
    }

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case TileStat.SellAmount: {
        this.owner.sellQuantity = upgradedStat;
        break;
      } case TileStat.SellRate: {
        this.owner.sellInterval = upgradedStat;
        break;
      }
    }

    super.upgradeStat(stat, upgradeForFree);
  }
}

export class Market extends BuildingNode {
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

  stats: MarketStats;

  public constructor(resourceType: ResourceType, owningTile: Phaser.Tilemaps.Tile,
      tileData: BuildingTileData, scene: Phaser.Scene, game: GameService) {
    super (marketBuildingTypes[resourceType], true, tileData, owningTile, scene, game);

    this.soldResources = game.resources.getResources(resourceType);

    this.homeTile = game.map.mapLayer.findTile(tile => tile.properties['buildingNode'] &&
      tile.properties['buildingNode'].tileType === BuildingTileType.Home);
    this.owningTile = owningTile;

    this.stats = new MarketStats(tileData.stats, this, game);

    this.calculateConnection();
  }

  public tick(elapsed: number, deltaTime: number) {
    super.tick(elapsed, deltaTime);

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

  public calculateConnection() {
    this.game.map.findPath(this.homeTile, this.owningTile, true, true).subscribe(path => {
      this.tilePath = path;
    });
  }

  logSale(profit: number) {
    this.recentSales.push(profit);

    if (this.recentSales.length >= this.recentWindowSize) {
      this.recentSales = this.recentSales.slice(1, this.recentWindowSize);
    }
  }

  public get averageRecentProfit(): number {
    if (!this.recentSales.length) {
      return 0;
    }
    return this.recentSales.reduce((total, sale) => total += sale) / this.recentSales.length;
  }
}
