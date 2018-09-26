import { Component, OnInit } from '@angular/core';

import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceEnum } from '../../objects/resourceData';
import { Upgrade, UpgradeType, UpgradeVariable } from '../../objects/upgrade';
import { UpgradesService } from '../../services/upgrades/upgrades.service';
import { SettingsService } from '../../services/settings/settings.service';
import { AdminService } from '../../services/admin/admin.service';

@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  styleUrls: ['./upgrades.component.css']
})
export class UpgradesComponent implements OnInit {
  upgradeTypes = UpgradeType;
  upgradeVariables = UpgradeVariable;
  upgradeVariableNames = Upgrade.UpgradeVariableNames;

  constructor(public resourcesService: ResourcesService,
              public upgradesService: UpgradesService,
              public settingsService: SettingsService,
              public adminService: AdminService) { }

  ngOnInit() {
  }

  canAffordUpgrade(id: number) {
    return this.upgradesService.getUpgrade(id).canAfford();
  }

  getUpgrades(filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean,
      upgradeType?: string, upgradeVariable?: string): Upgrade[] {
    return this.upgradesService.getUpgrades(filterByPurchased, filterByUnpurchased, filterByAccessible,
      UpgradeType[upgradeType], UpgradeVariable[upgradeVariable]);
  }

  purchaseUpgrade(id: number) {
    this.upgradesService.getUpgrade(id).purchaseUpgrade();
  }

  getBackgroundColor(id: number): string {
    const upgrade = this.upgradesService.getUpgrade(id);

    if (upgrade.purchased) {
      return 'lightgreen';
    } else if (!upgrade.canAfford()) {
      return 'gray';
    }

    return 'lightblue';
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.resourcesService.resources.get(resourceEnum);
  }

  get hidePurchasedUpgrades(): boolean {
    return this.upgradesService.hidePurchasedUpgrades;
  }

  set hidePurchasedUpgrades(value: boolean) {
    this.upgradesService.hidePurchasedUpgrades = value;
  }
}
