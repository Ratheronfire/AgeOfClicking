import { Injectable } from '@angular/core';

import { ResourcesService } from './../resources/resources.service';
import { UpgradeVariable } from '../../objects/upgrade';
import { UpgradesService } from '../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService) { }

  getResourceTooltip(resourceId: number): string {
    const resource = this.resourcesService.getResource(resourceId);
    const worker = this.workersService.getResourceWorker(resourceId);

    let tooltip = `${resource.resourceDescription}.`;

    if (resourceId === 0) {
      return tooltip;
    }

    let neededUpgrades = this.upgradesService.upgradesOfVariable(UpgradeVariable.Harvestability, false, true, false);
    neededUpgrades = neededUpgrades.filter(upgrade => upgrade.upgradeEffects.some(ue =>
      (ue.resourceType === resource.resourceType || ue.resourceId === resourceId)
      && ue.upgradeVariable === UpgradeVariable.Harvestability));

    if (neededUpgrades.length) {
      tooltip += '\nNeeded Upgrades:';
      for (const neededUpgrade of neededUpgrades) {
        tooltip += ` ${neededUpgrade.name},`;
      }
      tooltip = tooltip.substring(0, tooltip.length - 1);
      tooltip += '.';
    }

    if (resource.resourceConsumes.length) {
      tooltip += '\nResources required:';
      for (const resourceConsume of resource.resourceConsumes) {
        tooltip += ` ${this.resourcesService.getResource(resourceConsume.resourceId).name}: ${resourceConsume.cost},`;
      }
      tooltip = tooltip.substring(0, tooltip.length - 1);
      tooltip += '.';
  }

    tooltip += `\n${Math.floor(100 * resource.harvestYield / resource.harvestMilliseconds * 1000) / 100} harvested per second;` +
               ` ${Math.floor(100 * worker.workerYield * worker.workerCount) / 100} per second from workers.`;

     return tooltip;
  }

  getWorkerTooltip(resourceId: number): string {
    const resource = this.resourcesService.getResource(resourceId);
    const resourceWorker = this.workersService.getResourceWorker(resourceId);

    return `${resource.workerVerb} ${resourceWorker.workerYield} ` +
      `${resource.workerNoun}${resourceWorker.workerYield === 1 ? '' : 's'} per second.`;
  }
}
