import { Injectable } from '@angular/core';

import { Upgrade, UpgradeType, UpgradeVariable } from '../../objects/upgrade';
import { MessageSource } from '../../objects/message';
import { ResourcesService } from '../resources/resources.service';
import { WorkersService } from './../workers/workers.service';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseUpgrades = require('../../../assets/json/upgrades.json');

@Injectable({
  providedIn: 'root'
})
export class UpgradesService {
  public upgrades: Upgrade[] = [];
  hidePurchasedUpgrades = true;

  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService,
              private messagesService: MessagesService) {
    this.loadBaseUpgrades();
  }

  public loadBaseUpgrades() {
    for (const baseUpgrade of baseUpgrades) {
      const upgrade = new Upgrade(baseUpgrade.id, baseUpgrade.name, baseUpgrade.description, baseUpgrade.upgradeType,
                                  baseUpgrade.upgradeEffects, baseUpgrade.resourceCosts, false,
                                  this.resourcesService, this.workersService, this.messagesService);
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
      rc => this.resourcesService.resources.get(rc.resourceEnum).resourceAccessible));
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
    this.messagesService.add(MessageSource.Upgrades, message);
  }
}
