import { Injectable } from '@angular/core';

import { Upgrade, UpgradeType, UpgradeVariable } from './upgrade';
import { Resource } from './resource';
import { ResourcesService } from './resources.service';
import { Worker } from './worker';
import { WorkersService } from './workers.service';
import { MessagesService } from './messages.service';
import { Tooltip } from './tooltip';

import * as baseUpgrades from 'src/assets/json/upgrades.json';

@Injectable({
  providedIn: 'root'
})
export class UpgradesService {
  public upgrades = baseUpgrades.default;

  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService,
              private messagesService: MessagesService) { }

  public purchaseUpgrade(id: number) {
    const upgrade = this.upgrades[id];

    if (upgrade.purchased || !this.canAffordUpgrade(id)) {
      return;
    }

    for (const resourceCost of upgrade.resourceCosts) {
      this.resourcesService.resources[resourceCost.resourceId].amount -= resourceCost.resourceCost;
    }

    for (const upgradeEffect of upgrade.upgradeEffects) {
      const resourceToUpgrade = this.resourcesService.resources[upgradeEffect.upgradeTargetId];
      const workerToUpgrade = this.workersService.workers[upgradeEffect.upgradeTargetId];

      switch (upgradeEffect.upgradeVariable) {
          case UpgradeVariable.Harvestability: {
            resourceToUpgrade.harvestable = !!upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.HarvestYield: {
            resourceToUpgrade.harvestYield *= upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.HarvestMilliseconds: {
            resourceToUpgrade.harvestMilliseconds *= upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.Workable: {
            workerToUpgrade.workable = !!upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.WorkerYield: {
            resourceToUpgrade.workerYield *= upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.WorkerCost: {
            workerToUpgrade.cost *= upgradeEffect.upgradeFactor;
            break;
          }
    }
    }

    upgrade.purchased = true;
  }

  public canAffordUpgrade(id: number): boolean {
    for (const resourceCost of this.upgrades[id].resourceCosts) {
      if (this.resourcesService.resources[resourceCost.resourceId].amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  public upgradesOfType(upgradeType: UpgradeType, filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean) {
    let upgrades = this.upgrades.filter(upgrade => upgrade.upgradeType === upgradeType);

    if (filterByPurchased) {
      upgrades = upgrades.filter(upgrade => upgrade.purchased);
    }
    if (filterByUnpurchased) {
      upgrades = upgrades.filter(upgrade => !upgrade.purchased);
    }
    if (filterByAccessible) {
      upgrades = upgrades.filter(upgrade => upgrade.upgradeEffects.every(
        ue => this.resourcesService.resources[ue.upgradeTargetId].resourceAccessible));
    }

    return upgrades;
  }

  public getUpgradeTypeString(id: number): string {
    return UpgradeType[this.upgrades[id].upgradeType];
  }

  public getUpgradeVariableString(upgradeId: number, effectId: number): string {
    return UpgradeVariable[this.upgrades[upgradeId].upgradeEffects[effectId].upgradeVariable];
  }

  private log(message: string) {
    this.messagesService.add(`WorkersService: ${message}`);
  }
}
