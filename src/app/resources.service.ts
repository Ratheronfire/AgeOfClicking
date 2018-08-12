import { Injectable } from '@angular/core';

import { Resource, ResourceType } from './resource';
import { MessagesService } from './messages.service';
import { resource } from 'selenium-webdriver/http';

const baseResources: Resource[] = [
  { 
    id: 0,
    name: 'gold',
    resourceType: ResourceType.Currency,
    amount: 1000,
    resourceConsumes: [],
    harvestable: false,
    sellable: false
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
    sellsFor: 5
  },
  {
    id: 2,
    name: 'copper',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    harvestYield: 1,
    harvestMilliseconds: 1250,
    workerYield: 1,
    sellable: true,
    sellsFor: 7
  },
  {
    id: 3,
    name: 'tin',
    resourceType: ResourceType.Metal,
    amount: 0,
    resourceConsumes: [],
    harvestable: false,
    harvestYield: 1,
    harvestMilliseconds: 1250,
    workerYield: 1,
    sellable: true,
    sellsFor: 7
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
    sellsFor: 7
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
    sellsFor: 15
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
    sellsFor: 25
  }
];

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources;

  constructor(private messagesService: MessagesService) { }

  harvestResource(id: number) {
    if (!this.resources[id].harvestable || !this.canHarvest(id))
      return;

    for (let resourceConsume of this.resources[id].resourceConsumes) {
      this.resources[resourceConsume.resourceId].amount -= resourceConsume.cost;
    }

    this.resources[id].amount += this.resources[id].harvestYield;
  }

  public canHarvest(id: number): boolean {
    const resource = this.resources[id];

    if (!resource.harvestable)
      return false;

    for (let resourceConsume of resource.resourceConsumes) {
      if (this.resources[resourceConsume.resourceId].amount < resourceConsume.cost)
        return false;
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

  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
