import { GameService } from './../../game/game.service';
import { ResourceEnum } from '../resourceData';

export abstract class Stats<T> {
  statList: T[];
  statLevels: Map<T, number>;
  statCosts: Map<T, number>;

  protected game: GameService;

  constructor(stats: T[], game: GameService) {
    this.statList = stats;
    this.statLevels = new Map<T, number>();
    this.statCosts = new Map<T, number>();

    for (const stat of stats) {
      this.statLevels.set(stat, 1);
      this.statCosts.set(stat, 1500);
    }

    this.game = game;
  }

  public abstract getStatString(stat: T): string;
  public abstract getUpgradedStatString(stat: T): string;

  public canUpgradeStat(stat: T): boolean {
    return this.game.resources.getResource(ResourceEnum.Gold).amount >= this.statCosts.get(stat);
  }

  public abstract getStat(stat: T): number;
  public abstract getUpgradedStat(stat: T): number;

  public buyUpgrade(stat: T) {
    const cost = this.statCosts.get(stat);
    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-cost);
  }

  public upgradeStat(stat: T, upgradeForFree = false) {
    if (!this.canUpgradeStat(stat) && !upgradeForFree) {
      return;
    }

    if (!upgradeForFree) {
      this.buyUpgrade(stat);
    }

    this.statLevels.set(stat, this.statLevels.get(stat) + 1);
    this.statCosts.set(stat, this.statCosts.get(stat) * 1.5);
  }

  public get stringifiedLevels() {
    const levels: any = {};
    for (const stat of this.statList) {
      levels[stat] = this.statLevels.get(stat);
    }

    return levels;
  }
}
