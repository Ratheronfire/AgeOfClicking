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

    let tooltip = `${resource.resourceDescription}`;

    if (resourceId === 0) {
      return tooltip;
    }

    let neededUpgrades = this.upgradesService.upgradesOfVariable(UpgradeVariable.Harvestability, false, true, false);
    neededUpgrades = neededUpgrades.filter(upgrade => upgrade.upgradeEffects.some(ue =>
      ue.upgradeVariable === UpgradeVariable.Harvestability &&
      ((ue.resourceType === resource.resourceType && ue.upgradeIsForWholeType && resource.resourceTier <= ue.maxTier) ||
      ue.resourceId === resourceId)));

    if (neededUpgrades.length) {
      tooltip += `\nNeeded Upgrade: ${neededUpgrades[0].name}.`;
    }

    if (resource.resourceConsumes.length) {
      tooltip += '\nResources required:';
      for (const resourceConsume of resource.resourceConsumes) {
        tooltip += ` ${this.resourcesService.getResource(resourceConsume.resourceId).name}: ${resourceConsume.cost},`;
      }
      tooltip = tooltip.substring(0, tooltip.length - 1);
      tooltip += '.';
  }

    tooltip += `\n${Math.floor(resource.harvestYield * 100) / 100} harvested per click ` +
               `(${Math.floor(resource.harvestMilliseconds) / 1000} seconds per harvest).` +
               `\n${Math.floor(100 * worker.workerYield * worker.workerCount) / 100} per second from workers.`;

     return tooltip;
  }

  getWorkerTooltip(resourceId: number): string {
    const resource = this.resourcesService.getResource(resourceId);
    const resourceWorker = this.workersService.getResourceWorker(resourceId);

    return `${resource.workerVerb} ${Math.floor(resourceWorker.workerYield * 100) / 100} ` +
      `${resource.workerNoun}${resourceWorker.workerYield === 1 ? '' : 's'} per second.`;
  }
}
