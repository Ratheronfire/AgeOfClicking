import { Injectable } from '@angular/core';

import { Resource, ResourceType } from './resource';
import { MessagesService } from './messages.service';

import * as baseResources from 'src/assets/json/resources.json';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources.default;

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
