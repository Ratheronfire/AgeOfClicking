import { Component, OnInit, Inject } from '@angular/core';

import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ResourceType, } from '../../objects/resource';
import { ResourcesService } from '../../services/resources/resources.service';
import { Upgrade, UpgradeType, UpgradeVariable, UpgradeEffect, ResourceCost } from '../../objects/upgrade';
import { UpgradesService } from '../../services/upgrades/upgrades.service';
import { ResourceDialogComponent } from '../resource-dialog/resource-dialog.component';

@Component({
  selector: 'app-upgrade-dialog',
  templateUrl: './upgrade-dialog.component.html',
  styleUrls: ['./upgrade-dialog.component.css']
})
export class UpgradeDialogComponent implements OnInit {
  upgrade: Upgrade = {
    id: this.upgradesService.upgrades.length,
    upgradeType: UpgradeType.Resource,
    name: '',
    description: '',
    upgradeEffects: [],
    resourceCosts: [],
    purchased: false
  };

  editMode = false;

  resourceTypes = ResourceType;
  upgradeTypes = UpgradeType;
  upgradeVariables = UpgradeVariable;

  oldUpgradeId: 0;

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected _formBuilder: FormBuilder,
              public dialogRef: MatDialogRef<ResourceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    if (this.data.upgradeId !== undefined) {
      this.oldUpgradeId = this.data.upgradeId;

      this.populateUpgrade();
      this.upgrade.id = this.oldUpgradeId;

      this.editMode = true;
    }
  }

  populateUpgrade() {
    const upgradeId = +this.oldUpgradeId;
    const oldUpgrade = this.upgradesService.getUpgrade(upgradeId);

    this.upgrade.name = oldUpgrade.name;
    this.upgrade.upgradeType = oldUpgrade.upgradeType;
    this.upgrade.description = oldUpgrade.description;
    this.upgrade.purchased = false;

    for (const upgradeEffect of oldUpgrade.upgradeEffects) {
      this.upgrade.upgradeEffects.push({
        upgradeIsForWholeType: upgradeEffect.upgradeIsForWholeType,
        resourceType: upgradeEffect.resourceType,
        resourceId: upgradeEffect.resourceId,
        upgradeVariable: upgradeEffect.upgradeVariable,
        upgradeFactor: upgradeEffect.upgradeFactor,
      });
    }

    for (const resourceCost of oldUpgrade.resourceCosts) {
      this.upgrade.resourceCosts.push({
        resourceId: resourceCost.resourceId,
        resourceCost: resourceCost.resourceCost
      });
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  newUpgradeEffect() {
    this.upgrade.upgradeEffects[this.upgrade.upgradeEffects.length] = {
      upgradeIsForWholeType: false,
      resourceId: 0,
      upgradeVariable: UpgradeVariable.Harvestability,
      upgradeFactor: 1
    };
  }

  removeUpgradeEffect(upgradeEffect: UpgradeEffect) {
    this.upgrade.upgradeEffects = this.upgrade.upgradeEffects.filter(ue => ue !== upgradeEffect);
  }

  newResourceCost() {
    this.upgrade.resourceCosts[this.upgrade.resourceCosts.length] = {
      resourceId: 0,
      resourceCost: 0
    };
  }

  removeResourceCost(resourceCost: ResourceCost) {
    this.upgrade.resourceCosts = this.upgrade.resourceCosts.filter(rc => rc !== resourceCost);
  }

  saveUpgrade() {
    this.upgrade.id = +this.upgrade.id;

    for (const upgradeEffect of this.upgrade.upgradeEffects) {
      if (upgradeEffect.resourceId) {
        upgradeEffect.resourceId = +upgradeEffect.resourceId;
      }
      if (upgradeEffect.maxTier) {
        upgradeEffect.maxTier = +upgradeEffect.maxTier;
      }

      upgradeEffect.upgradeFactor = +upgradeEffect.upgradeFactor;
    }

    for (const resourceCost of this.upgrade.resourceCosts) {
      resourceCost.resourceId = +resourceCost.resourceId;
      resourceCost.resourceCost = +resourceCost.resourceCost;
    }

    const existingUpgrade = this.upgradesService.getUpgrade(this.upgrade.id);

    if (existingUpgrade === undefined) {
      this.upgradesService.upgrades.push(this.upgrade);
    } else {
      const oldIndex = this.upgradesService.upgrades.indexOf(existingUpgrade);
      this.upgradesService.upgrades[oldIndex] = this.upgrade;
    }
  }

  compareFn(item1: number, item2: number) {
    return +item1 === +item2;
  }
}
