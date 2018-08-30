import { Injectable } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseResources = require('../../../assets/json/resources.json');

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources;

  constructor(private messagesService: MessagesService) { }

  public getResource(id: number): Resource {
    return this.resources.find(resource => resource.id === id);
  }

  public finishResourceAnimation(id: number) {
    const resource = this.getResource(id);

    resource.amountTravelling--;

    this.harvestResource(id, 1, true);
  }

  public harvestResource(id: number, multiplier = 1, forceHarvest = false) {
    const resource = this.getResource(id);

    if (!forceHarvest && (!resource.harvestable || !this.canHarvest(id, multiplier))) {
      return;
    }

    for (const resourceConsume of resource.resourceConsumes) {
      this.addResourceAmount(resourceConsume.resourceId, -resourceConsume.cost * multiplier);
    }

    this.resources.filter(r => r.previousTier === resource.resourceTier && r.resourceType === resource.resourceType)
      .map(r => r.resourceAccessible = true);

    this.addResourceAmount(resource.id, resource.harvestYield * multiplier);
  }

  public canHarvest(id: number, multiplier = 1): boolean {
    const resource = this.getResource(id);

    if (!resource.harvestable || resource.harvesting) {
      return false;
    }

    for (const resourceConsume of resource.resourceConsumes) {
      if (this.getResource(resourceConsume.resourceId).amount < resourceConsume.cost * multiplier) {
        return false;
      }
    }

    return true;
  }

  public resourcesOfType(resourceType: ResourceType, filterByWorkable: boolean, filterByAccessible: boolean): Resource[] {
    let resources = this.resources.filter(resource => resource.resourceType === resourceType);

    if (filterByWorkable) {
      resources = resources.filter(resource => resource.worker.workable);
    }
    if (filterByAccessible) {
      resources = resources.filter(resource => resource.resourceAccessible);
    }

    return resources;
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
    const resource = this.getResource(id);

    if (id === 0) {
      return `${resource.resourceDescription}.`;
    }

    return `${resource.resourceDescription}. ${resource.harvestYield / resource.harvestMilliseconds * 1000}
     harvested per second; ${resource.workerYield * workerCount} per second from workers.`;
  }

  public addResourceAmount(id: number, amount: number) {
    this.getResource(id).amount += amount;
  }

  public canAfford(id: number): boolean {
    return (this.getResource(0).amount >= this.getResource(id).worker.cost);
  }

  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
