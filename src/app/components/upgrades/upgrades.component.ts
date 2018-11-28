import { Component, OnInit } from '@angular/core';
import { ResourceEnum } from '../../objects/resourceData';
import { Upgrade, UpgradeType, UpgradeVariable } from '../../objects/upgrade';
import { GameService } from './../../game/game.service';


@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  styleUrls: ['./upgrades.component.css']
})
export class UpgradesComponent implements OnInit {
  upgradeTypes = UpgradeType;
  upgradeVariables = UpgradeVariable;
  upgradeVariableNames = Upgrade.UpgradeVariableNames;

  constructor(public game: GameService) { }

  ngOnInit() {
  }

  canAffordUpgrade(id: number) {
    return this.game.upgrades.getUpgrade(id).canAfford();
  }

  getUpgrades(filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean,
      upgradeType?: string, upgradeVariable?: string): Upgrade[] {
    return this.game.upgrades.getUpgrades(filterByPurchased, filterByUnpurchased, filterByAccessible,
      UpgradeType[upgradeType], UpgradeVariable[upgradeVariable]);
  }

  purchaseUpgrade(id: number) {
    this.game.upgrades.getUpgrade(id).purchaseUpgrade();
  }

  getBackgroundColor(id: number): string {
    const upgrade = this.game.upgrades.getUpgrade(id);

    if (upgrade.purchased) {
      return 'lightgreen';
    } else if (!upgrade.canAfford()) {
      return 'gray';
    }

    return 'lightblue';
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.game.resources.getResource(resourceEnum);
  }

  get hidePurchasedUpgrades(): boolean {
    return this.game.upgrades.hidePurchasedUpgrades;
  }

  set hidePurchasedUpgrades(value: boolean) {
    this.game.upgrades.hidePurchasedUpgrades = value;
  }
}
