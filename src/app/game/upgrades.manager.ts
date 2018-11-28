import { MessageSource } from '../objects/message';
import { Upgrade, UpgradeType, UpgradeVariable } from '../objects/upgrade';
import { GameService } from './game.service';

declare var require: any;
const baseUpgrades = require('../../assets/json/upgrades.json');

export class UpgradesManager {
  public upgrades: Upgrade[] = [];
  hidePurchasedUpgrades = true;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

    this.loadBaseUpgrades();
  }

  public loadBaseUpgrades() {
    this.upgrades = [];
    for (const baseUpgrade of baseUpgrades) {
      const upgrade = new Upgrade(baseUpgrade.id, baseUpgrade.name, baseUpgrade.description, baseUpgrade.upgradeType,
                                  baseUpgrade.upgradeEffects, baseUpgrade.resourceCosts, false, this.game);
      this.upgrades.push(upgrade);
    }
  }

  public getUpgrade(id: number): Upgrade {
    return this.upgrades.find(upgrade => upgrade.id === id);
  }

  public getUpgrades(filterByPurchased = false, filterByUnpurchased = false, filterByAccessible = false,
                     upgradeType?: UpgradeType, upgradeVariable?: UpgradeVariable): Upgrade[] {
    let upgrades = this.upgrades;

    if (upgradeType) {
      upgrades = upgrades.filter(upgrade => upgrade.upgradeType === upgradeType);
    }
    if (upgradeVariable) {
      upgrades = upgrades.filter(upgrade => upgrade.upgradeEffects.some(ue => ue.upgradeVariable === upgradeVariable));
    }
    if (filterByPurchased) {
      upgrades = upgrades.filter(upgrade => upgrade.purchased);
    }
    if (filterByUnpurchased) {
      upgrades = upgrades.filter(upgrade => !upgrade.purchased);
    }
    if (filterByAccessible) {
      upgrades = upgrades.filter(upgrade => upgrade.resourceCosts.every(
      rc => this.game.resources.getResource(rc.resourceEnum).resourceAccessible));
    }

    return upgrades;
  }

  public getUpgradeTypeString(id: number): string {
    return UpgradeType[this.getUpgrade(id).upgradeType];
  }

  public getUpgradeVariableString(upgradeId: number, effectId: number): string {
    return UpgradeVariable[this.getUpgrade(upgradeId).upgradeEffects[effectId].upgradeVariable];
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Upgrades, message);
  }
}
