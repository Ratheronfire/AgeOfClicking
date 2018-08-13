import { Injectable } from '@angular/core';

import { Resource, ResourceType } from './resource';
import { MessagesService } from './messages.service';

const baseResources: Resource[] = [
  {
    id: 0,
    name: 'gold',
    resourceType: ResourceType.Currency,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    sellable: false,
    resourceDescription: 'Shiny and valuable',
    workerVerb: '',
    workerNoun: 'gold'
  },
  {
    id: 1,
    name: 'wood',
    resourceType: ResourceType.Wood,
    amount: 0,
    resourceConsumes: [],
    harvestable: true,
    harvestYield: 1,
    harvestMilliseconds: 1000,
    workerYield: 2,
    sellable: true,
    sellsFor: 5,
    resourceDescription: 'Strong oak logs',
    workerVerb: 'Fells',
    workerNoun: 'log'
  },
  {
    id: 2,
    name: 'copper ore',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    harvestYield: 1,
    harvestMilliseconds: 1250,
    workerYield: 1,
    sellable: true,
    sellsFor: 7,
    resourceDescription: 'Can be forged into bronze along with tin',
    workerVerb: 'Mines',
    workerNoun: 'copper ore'
  },
  {
    id: 3,
    name: 'tin ore',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    harvestYield: 1,
    harvestMilliseconds: 1250,
    workerYield: 1,
    sellable: true,
    sellsFor: 7,
    resourceDescription: 'Can be forged into bronze along with copper',
    workerVerb: 'Mines',
    workerNoun: 'tin ore'
  },
  {
    id: 4,
    name: 'bronze ingot',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [
      {resourceId: 2, cost: 1},
      {resourceId: 3, cost: 1}
    ],
    harvestable: true,
    harvestYield: 1,
    harvestMilliseconds: 2000,
    workerYield: 1,
    sellable: true,
    sellsFor: 7,
    resourceDescription: 'Somewhat brittle ingots',
    workerVerb: 'Forges',
    workerNoun: 'bronze ingot'
  },
  {
    id: 5,
    name: 'iron ore',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    harvestYield: 1,
    harvestMilliseconds: 2000,
    workerYield: 1,
    sellable: true,
    sellsFor: 15,
    resourceDescription: 'Unrefined extracts of iron',
    workerVerb: 'Mines',
    workerNoun: 'iron ore'
  },
  {
    id: 6,
    name: 'iron ingot',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [
      {resourceId: 5, cost: 1}
    ],
    harvestable: true,
    harvestYield: 1,
    harvestMilliseconds: 3000,
    workerYield: 1,
    sellable: true,
    sellsFor: 25,
    resourceDescription: 'Dim but sturdy ingots',
    workerVerb: 'Forges',
    workerNoun: 'iron ingot'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources;

  constructor(private messagesService: MessagesService) { }

  harvestResource(id: number) {
    if (!this.resources[id].harvestable || !this.canHarvest(id)) {
      return;
    }

    for (const resourceConsume of this.resources[id].resourceConsumes) {
      this.resources[resourceConsume.resourceId].amount -= resourceConsume.cost;
    }

    this.resources[id].amount += this.resources[id].harvestYield;
  }

  public canHarvest(id: number): boolean {
    const resource = this.resources[id];

    if (!resource.harvestable) {
      return false;
    }

    for (const resourceConsume of resource.resourceConsumes) {
      if (this.resources[resourceConsume.resourceId].amount < resourceConsume.cost) {
        return false;
      }
    }

    return true;
  }

  public resourcesOfType(resourceType: ResourceType): Resource[] {
    return this.resources.filter(resource => resource.resourceType === resourceType);
  }

  public harvestableResources(): Resource[] {
    return this.resources.filter(resource => resource.harvestable);
  }

  public sellableResources(): Resource[] {
    return this.resources.filter(resource => resource.sellable);
  }

  public resourceIds(): number[] {
    return this.resources.map(resource => resource.id);
  }

  public resourceTooltip(id: number, workerCount: number): string {
    const resource = this.resources[id];

    if (id === 0) {
      return `${resource.resourceDescription}.`;
    }

    return `${resource.resourceDescription}. ${resource.harvestYield / resource.harvestMilliseconds * 1000}
     harvested per second; ${resource.workerYield * workerCount} per second from workers.`;
  }

  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
