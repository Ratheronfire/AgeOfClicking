import { ResourceType } from './../resource';
import { Component, OnInit } from '@angular/core';

import { Upgrade, UpgradeType, UpgradeVariable, UpgradeEffect, ResourceCost } from 'src/app/upgrade';
import { UpgradesService } from 'src/app/upgrades.service';
import { ResourcesService } from 'src/app/resources.service';

@Component({
  selector: 'app-admin-upgrade-configuration',
  templateUrl: './admin-upgrade-configuration.component.html',
  styleUrls: ['./admin-upgrade-configuration.component.css']
})
export class AdminUpgradeConfigurationComponent implements OnInit {
  upgradeVariables = UpgradeVariable;

  upgradeTypes = UpgradeType;
  resourceTypes = ResourceType;
  upgradeIndex = 0;
  upgrade = this.upgradesService.upgrades[this.upgradeIndex];

  constructor(private upgradesService: UpgradesService,
              private resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  newUpgrade() {
    this.upgradeIndex = this.upgradesService.upgrades.length;
    this.upgrade = {id: this.upgradeIndex, upgradeType: UpgradeType.Resource, name: '', description: '',
      upgradeEffects: [], resourceCosts: [], purchased: false};

    this.upgradesService.upgrades[this.upgradeIndex] = this.upgrade;
  }

  newUpgradeEffect() {
    this.upgrade.upgradeEffects[this.upgrade.upgradeEffects.length] = {
        upgradeIsForWholeType: false, resourceType: ResourceType.Currency, resourceId: 0,
        upgradeVariable: UpgradeVariable.HarvestYield, upgradeFactor: 2
      };
  }

  removeUpgradeEffect(upgradeEffect: UpgradeEffect) {
    this.upgrade.upgradeEffects = this.upgrade.upgradeEffects.filter(ue => ue !== upgradeEffect);
  }

  newResourceCost() {
    this.upgrade.resourceCosts[this.upgrade.resourceCosts.length] = {resourceId: 0, resourceCost: 1};
  }

  removeResourceCost(resourceCost: ResourceCost) {
    this.upgrade.resourceCosts = this.upgrade.resourceCosts.filter(rc => rc !== resourceCost);
  }

  removeUpgrade() {
    this.upgradesService.upgrades = this.upgradesService.upgrades.filter(upgrade => upgrade.id !== this.upgradeIndex);

    if (this.upgradeIndex > 0) {
      this.upgradeIndex--;
    }

    this.upgrade = this.upgradesService.upgrades[this.upgradeIndex];
  }

  previousUpgradeExists(): boolean {
    return this.upgradeIndex > 0;
  }

  nextUpgradeExists(): boolean {
    return this.upgradeIndex + 1 < this.upgradesService.upgrades.length;
  }

  previousUpgrade() {
    if (!this.previousUpgradeExists()) {
      return;
    }

    this.upgradeIndex--;
    this.upgrade = this.upgradesService.upgrades[this.upgradeIndex];
  }

  nextUpgrade() {
    if (!this.nextUpgradeExists()) {
      return;
    }

    this.upgradeIndex++;
    this.upgrade = this.upgradesService.upgrades[this.upgradeIndex];
  }

  prepareUpgradeForJson(upgrade: Upgrade) {
    upgrade.id = +upgrade.id;

    for (const upgradeEffect of upgrade.upgradeEffects) {
      upgradeEffect.resourceId = +upgradeEffect.resourceId;
      upgradeEffect.upgradeFactor = +upgradeEffect.upgradeFactor;
    }

    for (const resourceCost of upgrade.resourceCosts) {
      resourceCost.resourceId = +resourceCost.resourceId;
      resourceCost.resourceCost = + resourceCost.resourceCost;
    }

    upgrade.purchased = false;
  }

  stringifyUpgrade() {
    this.prepareUpgradeForJson(this.upgrade);

    alert(JSON.stringify(this.upgrade));
  }

  stringifyUpgrades() {
    for (const upgrade of this.upgradesService.upgrades) {
      this.prepareUpgradeForJson(upgrade);
    }

    alert(JSON.stringify(this.upgradesService.upgrades));
  }
}
