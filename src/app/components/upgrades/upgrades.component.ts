import { Component, OnInit } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourcesService } from '../../services/resources/resources.service';
import { Upgrade, ResourceCost, UpgradeType } from '../../objects/upgrade';
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

  constructor(public resourcesService: ResourcesService,
              public upgradesService: UpgradesService,
              public settingsService: SettingsService,
              public adminService: AdminService) { }

  ngOnInit() {
  }

  canAffordUpgrade(id: number) {
    return this.upgradesService.canAffordUpgrade(id);
  }

  getUpgrades(filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    return this.upgradesService.getUpgrades(filterByPurchased, filterByUnpurchased, filterByAccessible);
  }

  upgradesOfType(upgradeType: string, filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    return this.upgradesService.upgradesOfType(this.upgradeTypes[upgradeType], filterByPurchased, filterByUnpurchased, filterByAccessible);
  }

  purchaseUpgrade(id: number) {
    this.upgradesService.purchaseUpgrade(id);
  }

  getBackgroundColor(id: number): string {
    const upgrade = this.upgradesService.getUpgrade(id);

    if (upgrade.purchased) {
      return 'lightgreen';
    } else if (!this.upgradesService.canAffordUpgrade(id)) {
      return 'gray';
    }

    return 'lightblue';
  }

  editUpgrade(id: number) {
    this.adminService.openUpgradeDialog(id);
  }

  getResource(resourceId: number) {
    return this.resourcesService.getResource(resourceId);
  }

  get hidePurchasedUpgrades(): boolean {
    return this.upgradesService.hidePurchasedUpgrades;
  }

  set hidePurchasedUpgrades(value: boolean) {
    this.upgradesService.hidePurchasedUpgrades = value;
  }
}
