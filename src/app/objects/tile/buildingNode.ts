import { GameService } from './../../game/game.service';
import { HealthBar } from '../healthbar';
import { BuildingTileType, TileStat, BuildingTileData } from './tile';
import { Stats } from '../entity/stats';

export class TileStats extends Stats<TileStat> {
  owner: BuildingNode;

  public constructor(statList: TileStat[], owner: BuildingNode, game: GameService) {
    super(statList, game);

    this.owner = owner;
  }

  public getStatString(stat: TileStat): string {
    switch (stat) {
      case TileStat.MaxHealth: {
        return `Max Health: ${Math.floor(this.owner.maxHealth)}`;
      }
    }
  }

  public getUpgradedStatString(stat: TileStat): string {
    switch (stat) {
      case TileStat.MaxHealth: {
        return `Max Health: ${Math.floor(this.getUpgradedStat(stat))}`;
      }
    }
  }

  public getStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.MaxHealth: {
        return Math.floor(this.owner.maxHealth);
      }
    }
  }

  public getUpgradedStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.MaxHealth: {
        return Math.floor(this.owner.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: TileStat, upgradeForFree = false) {
    if (!this.canUpgradeStat(stat) && !upgradeForFree) {
      return;
    }

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case TileStat.MaxHealth: {
        this.owner.maxHealth = upgradedStat;
        this.owner.health = this.owner.maxHealth;
        break;
      }
    }

    super.upgradeStat(stat, upgradeForFree);
  }
}

export class BuildingNode {
  tileType: BuildingTileType;
  owningTile: Phaser.Tilemaps.Tile;

  removable: boolean;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  stats: TileStats;

  protected game: GameService;

  constructor(tileType: BuildingTileType, removable: boolean, tileData: BuildingTileData,
    owningTile: Phaser.Tilemaps.Tile, scene: Phaser.Scene, game: GameService) {
    this.tileType = tileType;
    this.owningTile = owningTile;

    this.removable = removable;

    this.health = 0;
    this.maxHealth = tileData.baseHealth;

    this.healthBar = new HealthBar(owningTile, scene);

    this.stats = new TileStats(tileData.stats, this, game);

    this.game = game;
  }

  tick(elapsed: number, deltaTime: number) {
    this.healthBar.tick(elapsed, deltaTime, this.owningTile.getCenterX(), this.owningTile.getCenterY());

    if (this.health <= 0) {
      // Phaser.Tilemaps.Tile.tint seems to be somewhat broken at the moment.
      // This line tints and broken buildings in a light red color.
      const buildingTile = this.game.map.buildingLayer.getTileAt(this.owningTile.x, this.owningTile.y);
      buildingTile.tint = 0x9999ff;
    }
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

  destroy() {
    this.healthBar.destroy();
  }
}
