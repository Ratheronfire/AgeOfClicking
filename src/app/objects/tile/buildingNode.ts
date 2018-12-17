import { GameService } from './../../game/game.service';
import { HealthBar } from '../healthbar';
import { BuildingTileType, TileStat, BuildingTileData } from './tile';
import { Stats } from '../entity/stats';
import { ResourceEnum } from '../resourceData';

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
        break;
      }
    }

    super.upgradeStat(stat, upgradeForFree);
  }
}

export class BuildingNode {
  tileType: BuildingTileType;
  tileData: BuildingTileData;
  owningTile: Phaser.Tilemaps.Tile;

  removable: boolean;

  protected resourceStockpile: Map<ResourceEnum, number>;

  maxHealth: number;
  healthBar: HealthBar;

  stats: TileStats;

  protected game: GameService;

  constructor(tileType: BuildingTileType, removable: boolean, tileData: BuildingTileData,
    owningTile: Phaser.Tilemaps.Tile, scene: Phaser.Scene, game: GameService) {
    this.tileType = tileType;
    this.tileData = tileData;
    this.owningTile = owningTile;

    this.removable = removable;

    this.resourceStockpile = new Map<ResourceEnum, number>();
    for (const resourceCost of tileData.resourceCosts) {
      this.resourceStockpile.set(resourceCost.resourceEnum, 0);
    }

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
    } else if (this.health >= this.maxHealth) {
      const buildingTile = this.game.map.buildingLayer.getTileAt(this.owningTile.x, this.owningTile.y);
      buildingTile.tint = 0xffffff;
    }
  }

  /** Takes an amount of damage. Building health is represented by an amout of resources stored
   *    within, so this function removes the corresponding amount of resources and returns them.
   * @param pointsTaken The number of health points to remove.
   * @returns A collection of resources and the amount removed of each. */
  takeDamage(pointsTaken: number) {
    const healthRatio = pointsTaken / this.maxHealth;

    const resourcesToTake = healthRatio * this.totalResourceCost;
    const resourcesTaken = this.removeResource(resourcesToTake);

    this.updateHealthbar();

    return resourcesTaken;
  }

  /** Removes an amount of resources from this building.
   * The resource to be removed is chosen automatically based on the remaining stock.
   * @param amount The amount of resources to remove.
   * @returns A collection of resources and the amount removed of each. */
  removeResource(amount: number) {
    const resourcesRemoved = {};

    for (let i = this.tileData.resourceCosts.length - 1; i > 0; i--) {
      if (amount <= 0) {
        break;
      }

      const resourceToRemove = this.tileData.resourceCosts[i];
      const oldAmount = this.resourceStockpile.get(resourceToRemove.resourceEnum);

      if (oldAmount <= 0) {
        continue;
      }

      const amountToRemove = Math.min(oldAmount, amount);
      this.resourceStockpile.set(resourceToRemove.resourceEnum, oldAmount - amountToRemove);
      resourcesRemoved[resourceToRemove.resourceEnum] = amountToRemove;
    }

    this.updateHealthbar();

    return resourcesRemoved;
  }

  /** For a given resource, returns the amount of that resource still needed. */
  getRemainingResourceCost(resourceEnum: ResourceEnum): number {
    const maxCost = this.getResourceCost(resourceEnum);
    const amountNeeded = maxCost - this.resourceStockpile.get(resourceEnum);

    return Math.floor(amountNeeded);
  }

  /** For a given resource, returns the total amount required. */
  getResourceCost(resourceEnum: ResourceEnum): number {
    return this.tileData.resourceCosts.find(cost => cost.resourceEnum === resourceEnum).resourceCost;;
  }

  /** Adds resources used to create/repair the building, up to its max capacity.
   * @param resourceEnum The resource to add.
   * @param amount The number of resources to add.
   */
  addResource(resourceEnum: ResourceEnum, amount: number) {
    const maxCost = this.tileData.resourceCosts.find(cost => cost.resourceEnum === resourceEnum).resourceCost;
    const newAmount = Math.min(maxCost, this.resourceStockpile.get(resourceEnum) + amount);

    this.resourceStockpile.set(resourceEnum, newAmount);

    this.updateHealthbar();
  }

  /** Sets the building's health by manually altering the building's resource stockpiles.
   * @param newHealth The new health value.
   */
  setHealth(newHealth: number) {
    const healthRatio = newHealth / this.maxHealth;

    for (const resource of this.tileData.resourceCosts) {
      this.resourceStockpile.set(resource.resourceEnum, resource.resourceCost * healthRatio);
    }

    this.updateHealthbar();
  }

  updateHealthbar() {
    this.healthBar.updateHealthbar(this.health / this.maxHealth);
  }

  destroy() {
    this.healthBar.destroy();
  }

  get health(): number {
    if (!this.totalResourceCost) {
      return this.maxHealth;
    }

    const percentageCollected = this.resourceTotalCollected / this.totalResourceCost;
    return percentageCollected * this.maxHealth;
  }

  get totalResourceCost(): number {
    if (!this.tileData.resourceCosts.length) {
      return 0;
    }

    return this.tileData.resourceCosts.map(cost => cost.resourceCost)
      .reduce((total, cost) => total += cost);
  }

  get resourceTotalCollected(): number {
    const resourcesCollected = Array.from(this.resourceStockpile.values());
    if (!resourcesCollected.length) {
      return 0;
    }

    return resourcesCollected.reduce((total, amount) => total += amount);
  }

  get resourcesNeeded(): ResourceEnum[] {
    if (!this.tileData.resourceCosts.length) {
      return [];
    }

    return this.tileData.resourceCosts
      .filter(cost => this.resourceStockpile.get(cost.resourceEnum) < cost.resourceCost)
      .map(cost => cost.resourceEnum);
  }
}
