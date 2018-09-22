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
  public upgrades: Upgrade[] = baseUpgrades;
  hidePurchasedUpgrades = true;

  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService,
              private messagesService: MessagesService) { }

  public getUpgrade(id: number): Upgrade {
    return this.upgrades.find(upgrade => upgrade.id === id);
  }

  public purchaseUpgrade(id: number) {
    const upgrade = this.getUpgrade(id);

    if (upgrade.purchased || !this.canAffordUpgrade(id)) {
      return;
    }

    for (const resourceCost of upgrade.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, -resourceCost.resourceCost);
    }

    this.applyUpgrade(upgrade);

    upgrade.purchased = true;
  }

  public applyUpgrade(upgrade: Upgrade) {
    for (const upgradeEffect of upgrade.upgradeEffects) {
      if (upgradeEffect.upgradeVariable === UpgradeVariable.WorkerCost) {
        this.workersService.getWorker(upgradeEffect.resourceType).cost *= upgradeEffect.upgradeFactor;
        continue;
      }

      let resourcesToUpgrade = [this.resourcesService.getResource(upgradeEffect.resourceId)];
      let workersToUpgrade = [this.workersService.getResourceWorker(upgradeEffect.resourceId)];

      if (upgradeEffect.upgradeIsForWholeType) {
        resourcesToUpgrade = this.resourcesService.resourcesOfType(upgradeEffect.resourceType, false, false, false);
        workersToUpgrade = this.workersService.getWorker(upgradeEffect.resourceType).workersByResource;

        if (upgradeEffect.maxTier >= 0) {
          resourcesToUpgrade = resourcesToUpgrade.filter(resource => resource.resourceTier <= upgradeEffect.maxTier);
          workersToUpgrade = workersToUpgrade.filter(worker =>
            this.resourcesService.getResource(worker.resourceId).resourceTier <= upgradeEffect.maxTier);
        }
      }

      for (const resourceToUpgrade of resourcesToUpgrade) {
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
          default: {
            break;
          }
        }
      }

      for (const workerToUpgrade of workersToUpgrade) {
        switch(upgradeEffect.upgradeVariable) {
          case UpgradeVariable.Workable: {
            workerToUpgrade.workable = !!upgradeEffect.upgradeFactor;
            break;
          }
          case UpgradeVariable.WorkerYield: {
            workerToUpgrade.workerYield *= upgradeEffect.upgradeFactor;
            break;
          }
          default: {
            break;
          }
        }
      }
    }

    this.log('Purchased upgrade: ' + upgrade.name);
  }

  public canAffordUpgrade(id: number): boolean {
    for (const resourceCost of this.getUpgrade(id).resourceCosts) {
      if (this.resourcesService.getResource(resourceCost.resourceId).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  public getUpgrades(filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    let upgrades = this.upgrades;

    if (filterByPurchased) {
      upgrades = upgrades.filter(upgrade => upgrade.purchased);
    }
    if (filterByUnpurchased) {
      upgrades = upgrades.filter(upgrade => !upgrade.purchased);
    }
    if (filterByAccessible) {
      upgrades = upgrades.filter(upgrade => upgrade.resourceCosts.every(
      rc => this.resourcesService.getResource(rc.resourceId).resourceAccessible));
    }

    return upgrades;
    }

  public upgradesOfType(upgradeType: UpgradeType,
                        filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    let upgrades = this.upgrades.filter(upgrade => upgrade.upgradeType === upgradeType);

    if (filterByPurchased) {
      upgrades = upgrades.filter(upgrade => upgrade.purchased);
    }
    if (filterByUnpurchased) {
      upgrades = upgrades.filter(upgrade => !upgrade.purchased);
    }
    if (filterByAccessible) {
      upgrades = upgrades.filter(upgrade => upgrade.resourceCosts.every(
        rc => this.resourcesService.getResource(rc.resourceId).resourceAccessible));
    }

    return upgrades;
  }

  public upgradesOfVariable(upgradeVariable: UpgradeVariable,
                            filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    let upgrades = this.upgrades.filter(upgrade => upgrade.upgradeEffects.some(ue => ue.upgradeVariable === upgradeVariable));

    if (filterByPurchased) {
      upgrades = upgrades.filter(upgrade => upgrade.purchased);
    }
    if (filterByUnpurchased) {
      upgrades = upgrades.filter(upgrade => !upgrade.purchased);
    }
    if (filterByAccessible) {
      upgrades = upgrades.filter(upgrade => upgrade.resourceCosts.every(
        rc => this.resourcesService.getResource(rc.resourceId).resourceAccessible));
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
