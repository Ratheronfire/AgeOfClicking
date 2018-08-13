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
  upgradeId = 0;
  upgrade = this.upgradesService.upgrades[this.upgradeId];

  constructor(private upgradesService: UpgradesService,
              private resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  newUpgrade() {
    this.upgradeId = this.upgradesService.upgrades.length;
    this.upgrade = {id: this.upgradeId, upgradeType: UpgradeType.Resource, name: '', description: '',
      upgradeEffects: [], resourceCosts: [], purchased: false};

    this.upgradesService.upgrades[this.upgradeId] = this.upgrade;
  }

  newUpgradeEffect() {
    this.upgrade.upgradeEffects[this.upgrade.upgradeEffects.length] =
      {upgradeTargetId: 0, upgradeVariable: UpgradeVariable.HarvestYield, upgradeFactor: 2};
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
    this.upgradesService.upgrades = this.upgradesService.upgrades.filter(upgrade => upgrade.id !== this.upgradeId);

    if (this.upgradeId > 0) {
      this.upgradeId--;
    }

    this.upgrade = this.upgradesService.upgrades[this.upgradeId];
  }

  previousUpgradeExists(): boolean {
    return this.upgradeId > 0;
  }

  nextUpgradeExists(): boolean {
    return this.upgradeId + 1 < this.upgradesService.upgrades.length;
  }

  previousUpgrade() {
    if (!this.previousUpgradeExists()) {
      return;
    }

    this.upgradeId--;
    this.upgrade = this.upgradesService.upgrades[this.upgradeId];
  }

  nextUpgrade() {
    if (!this.nextUpgradeExists()) {
      return;
    }

    this.upgradeId++;
    this.upgrade = this.upgradesService.upgrades[this.upgradeId];
  }

  stringifyUpgrade() {
    alert(JSON.stringify(this.upgrade));
  }

  stringifyUpgrades() {
    alert(JSON.stringify(this.upgradesService.upgrades));
  }
}
