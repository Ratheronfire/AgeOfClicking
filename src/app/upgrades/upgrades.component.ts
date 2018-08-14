import { Component, OnInit } from '@angular/core';

import { Resource } from '../resource';
import { ResourcesService } from '../resources.service';
import { Upgrade, ResourceCost, UpgradeType } from '../upgrade';
import { UpgradesService } from '../upgrades.service';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  styleUrls: ['./upgrades.component.css']
})
export class UpgradesComponent implements OnInit {
  upgradeTypes = UpgradeType;
  hidePurchased = false;

  constructor(private resourcesService: ResourcesService,
              private upgradesService: UpgradesService,
              private adminService: AdminService) { }

  ngOnInit() {
  }

  canAffordUpgrade(id: number) {
    return this.upgradesService.canAffordUpgrade(id);
  }

  upgradesOfType(upgradeType: string, filterByPurchased: boolean, filterByUnpurchased: boolean, filterByAccessible: boolean): Upgrade[] {
    return this.upgradesService.upgradesOfType(this.upgradeTypes[upgradeType], filterByPurchased, filterByUnpurchased, filterByAccessible);
  }

  purchaseUpgrade(id: number) {
    this.upgradesService.purchaseUpgrade(id);
  }

  getBackgroundColor(id: number): string {
    const upgrade = this.upgradesService.upgrades[id];

    if (upgrade.purchased) {
      return 'lightgreen';
    } else if (!this.upgradesService.canAffordUpgrade(id)) {
      return 'gray';
    }

    return 'lightblue';
  }
}
