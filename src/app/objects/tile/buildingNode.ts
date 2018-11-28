import { GameService } from './../../game/game.service';
import { HealthBar } from '../healthbar';
import { ResourceEnum } from '../resourceData';
import { BuildingTileType, TileStat } from './tile';
import { Market } from './market';

export class BuildingNode {
  tileType: BuildingTileType;
  owningTile: Phaser.Tilemaps.Tile;

  removable: boolean;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  market?: Market;

  statLevels = {};
  statCosts = {};

  private game: GameService;

  constructor(tileType: BuildingTileType, removable: boolean, health: number,
    owningTile: Phaser.Tilemaps.Tile, scene: Phaser.Scene, game: GameService) {
    this.tileType = tileType;
    this.owningTile = owningTile;

    this.removable = removable;

    this.health = health;
    this.maxHealth = health;

    this.statLevels[TileStat.MaxHealth] = 1;
    this.statCosts[TileStat.MaxHealth] = 1500;

    this.healthBar = new HealthBar(owningTile, scene);

    this.game = game;
  }

  tick(elapsed: number, deltaTime: number) {
    this.healthBar.tick(elapsed, deltaTime, this.owningTile.getCenterX(), this.owningTile.getCenterY());

    if (this.market) {
      this.market.tick(elapsed, deltaTime);
    }

    if (this.health <= 0) {
      // Phaser.Tilemaps.Tile.tint seems to be somewhat broken at the moment.
      // This line tints and broken buildings in a light red color.
      this.owningTile.tint = 0x9999ff;
    }
  }

  public canUpgradeStat(stat: TileStat): boolean {
    return this.game.resources.getResource(ResourceEnum.Gold).amount >= this.statCosts[stat];
  }

  public getUpgradedStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.SellAmount: {
        return this.market.sellQuantity * 1.2;
      }
      case TileStat.SellRate: {
        return this.market.sellInterval / 1.1;
      }
      case TileStat.MaxHealth: {
        return Math.floor(this.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: TileStat) {
    if (!this.canUpgradeStat(stat)) {
      return;
    }

    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-this.statCosts[stat]);

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case TileStat.SellAmount: {
        this.market.sellQuantity = upgradedStat;
        break;
      }
      case TileStat.SellRate: {
        this.market.sellInterval = upgradedStat;
        break;
      }
      case TileStat.MaxHealth: {
        this.maxHealth = upgradedStat;
        this.health = this.maxHealth;
        break;
      }
    }

    this.statLevels[stat]++;
    this.statCosts[stat] *= 1.5;
  }

  takeDamage(pointsTaken: number) {
    let newHealth = this.health - pointsTaken;

    if (newHealth < 0) {
      newHealth = 0;
    }

    this.setHealth(newHealth);
  }

  setHealth(newHealth: number) {
    this.health = newHealth;
    this.healthBar.updateHealthbar(this.health / this.maxHealth);
  }
}
