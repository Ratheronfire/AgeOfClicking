import { Injectable } from '@angular/core';

import { ResourcesService } from './../resources/resources.service';
import { UpgradesService } from '../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';
import { MapService } from './../map/map.service';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from './../../objects/resourceData';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  requiredUpgrades = {
    7: 8,
    8: 8,
    9: 9,
    15: 9,
    25: 10,
    16: 11,
    17: 12,
    2: 2,
    3: 2,
    13: 2,
    26: 5,
    5: 5,
    27: 13,
    28: 13,
    11: 13,
    29: 14,
    18: 14,
    30: 14,
    31: 15,
    20: 15,
    21: 15,
    22: 15
  };

  requiredBuildings = {
    4: 'CRACKEDFORGE',
    6: 'STONEFORGE',
    10: 'IRONFORGE',
    12: 'IRONFORGE',
    19: 'GOLDFORGE',
    23: 'LATINUMFORGE',
    24: 'TEMPROUSDISTILLERY'
  };

  consumersByResource = {
    1: 16,
    7: 16,
    8: 16,
    9: 16,
    15: 16,
    25: 16,
    16: 17,
    2: 4,
    3: 4,
    5: 6,
    6: 10,
    11: 12,
    10: 19,
    12: 19,
    18: 19,
    19: 23,
    20: 23,
    21: 23,
    22: 23,
    23: 24,
    31: 24
  };

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService,
              protected mapService: MapService) { }

  getResourceTooltip(resource: Resource): string {
    const worker = this.workersService.getResourceWorker(resource.resourceEnum);

    let tooltip = `${resource.resourceDescription}`;

    if (resource.resourceEnum === ResourceEnum.Gold) {
      let totalCost = 0;

      for (const _worker of this.workersService.getWorkers()) {
        for (const rw of _worker.getResourceWorkers()) {
          if (resource.canHarvest(rw.workerYield) && _worker.canAffordToHarvest(rw.resourceEnum)) {
            totalCost += rw.recurringCost * rw.workerCount;
          }
        }
      }

      tooltip += `\n${totalCost} spent on workers per second.`;

      return tooltip;
    }

    const requiredUpgrade = this.requiredUpgrades[resource.resourceEnum];
    if (requiredUpgrade) {
      const upgrade = this.upgradesService.getUpgrade(requiredUpgrade);
      tooltip += `\nNeeded Upgrade: ${upgrade.name}.`;
    }

    const requiredBuilding = this.requiredBuildings[resource.resourceEnum];
    if (requiredBuilding) {
      const building = this.mapService.buildingTiles[requiredBuilding];
      tooltip += `\nNeeded Building: ${building.name}.`;
    }

    if (resource.resourceConsumes.length) {
      tooltip += '\nResources required:';
      for (const resourceConsume of resource.resourceConsumes) {
        tooltip += ` ${this.resourcesService.resources.get(resourceConsume.resourceEnum).name}: ${resourceConsume.cost},`;
      }
      tooltip = tooltip.substring(0, tooltip.length - 1);
      tooltip += '.';
    }

    let workerOutput = worker.workerYield * worker.workerCount;
    if (resource.resourceEnum in this.consumersByResource) {
      const consumingResource = this.resourcesService.resources[this.consumersByResource[resource.resourceEnum]];
      const consumingWorker = this.workersService.getResourceWorker[this.consumersByResource[resource.resourceEnum]];
      workerOutput -=
        consumingResource.resourceConsumes.find(rc => rc.resourceEnum === resource.resourceEnum).cost * consumingWorker.workerCount;
    }

    tooltip += `\n${Math.floor(resource.harvestYield * 1000) / 1000} harvested per click ` +
               `(${Math.floor(resource.harvestMilliseconds) / 1000} seconds per harvest).` +
               `\n${Math.floor(1000 * workerOutput) / 1000} per second from workers.`;

     return tooltip;
  }

  getWorkerTooltip(resourceEnum: ResourceEnum): string {
    const resource = this.resourcesService.resources.get(resourceEnum);
    const resourceWorker = this.workersService.getResourceWorker(resourceEnum);

    return `${resource.workerVerb} ${Math.floor(resourceWorker.workerYield * 100) / 100} ` +
      `${resource.workerNoun}${resourceWorker.workerYield === 1 ? '' : 's'} per second.\n` +
      `Cost: ${resourceWorker.recurringCost} per worker per second (${resourceWorker.recurringCost * resourceWorker.workerCount} total).`;
  }
}
