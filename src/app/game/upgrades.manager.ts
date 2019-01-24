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
      const upgrade = new Upgrade(baseUpgrade.id, baseUpgrade.spriteIndex, baseUpgrade.name, baseUpgrade.description,
        baseUpgrade.flavorText, baseUpgrade.upgradeType, baseUpgrade.upgradeEffects, baseUpgrade.resourceCosts, false, this.game);
      this.upgrades.push(upgrade);
    }
  }

  public getUpgrade(id: number): Upgrade {
    return this.upgrades.find(upgrade => upgrade.id === id);
  }

  public getUpgrades(filterByPurchased = false, filterByUnpurchased = false, filterByAccessible = false,
                     upgradeTypesOrType?: UpgradeType | UpgradeType[], upgradeVariable?: UpgradeVariable): Upgrade[] {
    let upgrades = this.upgrades;

    if (upgradeTypesOrType) {
      const upgradeTypes = [].concat(upgradeTypesOrType);
      upgrades = upgrades.filter(upgrade => upgradeTypes.includes(upgrade.upgradeType));
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

    upgrades = upgrades.sort((a, b) => {
      const variableA = a.upgradeEffects[0].upgradeVariable;
      const variableB = b.upgradeEffects[0].upgradeVariable;

      if (variableA === variableB) {
        return a.id - b.id;
      }

      return variableA > variableB ? 1 : -1;
    });

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
