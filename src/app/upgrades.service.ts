import { Injectable } from '@angular/core';

import { Upgrade, UpgradeType, UpgradeVariable } from './upgrade';
import { Resource } from './resource';
import { ResourcesService } from './resources.service';
import { Worker } from './worker';
import { WorkersService } from './workers.service';
import { MessagesService } from './messages.service';
import { Tooltip } from './tooltip';

const baseUpgrades: Upgrade[] = [
  {
    id: 0,
    upgradeType: UpgradeType.Resource,
    name: 'Iron Axe',
    description: 'A stronger, more durable axe. Harvests 20% more wood per task.',
    upgradeEffects: [
      { upgradeTargetId: 1, upgradeVariable: UpgradeVariable.HarvestYield, upgradeFactor: 1.2 }
    ],
    resourceCosts: [
      { resourceId: 1, resourceCost: 10 },
      { resourceId: 2, resourceCost: 25 }
    ],
    purchased: false
  },
  {
    id: 1,
    upgradeType: UpgradeType.Resource,
    name: 'Twin Axes',
    description: "Double the axes, double the deforestation! Reduces wood harvesting time by 50%.",
    upgradeEffects: [
      { upgradeTargetId: 1, upgradeVariable: UpgradeVariable.HarvestMilliseconds, upgradeFactor: 0.5 }
    ],
    resourceCosts: [
      { resourceId: 1, resourceCost: 15 },
      { resourceId: 2, resourceCost: 35 }
    ],
    purchased: false
  },  
  {
    id: 2,
    upgradeType: UpgradeType.Resource,
    name: 'Pickaxe',
    description: "A basic pickaxe. Not much, but it gets the job done. Allows harvesting of tin and copper.",
    upgradeEffects: [
      { upgradeTargetId: 2, upgradeVariable: UpgradeVariable.Harvestability, upgradeFactor: 1 },
      { upgradeTargetId: 3, upgradeVariable: UpgradeVariable.Harvestability, upgradeFactor: 1 }
    ],
    resourceCosts: [
      { resourceId: 0, resourceCost: 50 }
    ],
    purchased: false
  }
];

@Injectable({
  providedIn: 'root'
})
export class UpgradesService {
  public upgrades = baseUpgrades;
  
  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService,
              private messagesService: MessagesService) { }
  
  public purchaseUpgrade(id: number) {
    var upgrade = this.upgrades[id];
    
    if (upgrade.purchased || !this.canAffordUpgrade(id))
      return;
    
    for (let resourceCost of upgrade.resourceCosts) {
      this.resourcesService.resources[resourceCost.resourceId].value -= resourceCost.resourceCost;
    }
    
    for (let upgradeEffect of upgrade.upgradeEffects) {
      var resourceToUpgrade = this.resourcesService.resources[upgradeEffect.upgradeTargetId];
      var workerToUpgrade = this.workersService.workers[upgradeEffect.upgradeTargetId];
      
      switch (upgradeEffect.upgradeVariable)
      {
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
    for (let resourceCost of this.upgrades[id].resourceCosts) {
      if (this.resourcesService.resources[resourceCost.resourceId].value < resourceCost.resourceCost)
        return false;
    }
    
    return true;
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
