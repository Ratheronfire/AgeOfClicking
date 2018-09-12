import { Injectable } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
import { MessageSource } from '../../objects/message';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseResources = require('../../../assets/json/resources.json');

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources;

  constructor(protected messagesService: MessagesService) { }

  public getResource(id: number): Resource {
    return this.resources.find(resource => resource.id === id);
  }

  public finishResourceAnimation(id: number, multiplier = 1, spawnedByPlayer: boolean) {
    const resource = this.getResource(id);

    if (spawnedByPlayer) {
      resource.amountTravelling--;
    }

    this.harvestResource(id, multiplier);
  }

  decuctResourceConsumes(id: number, multiplier = 1) {
    const resource = this.getResource(id);

    for (const resourceConsume of resource.resourceConsumes) {
      this.addResourceAmount(resourceConsume.resourceId, -resourceConsume.cost * multiplier);
    }

  }

  public harvestResource(id: number, multiplier = 1) {
    const resource = this.getResource(id);

    this.resources.filter(r => r.previousTier === resource.resourceTier && r.resourceType === resource.resourceType)
      .map(r => r.resourceAccessible = true);

    this.addResourceAmount(resource.id, multiplier);
  }

  public canHarvest(id: number, multiplier = 1): boolean {
    const resource = this.getResource(id);

    if (!resource.harvestable || !resource.pathAvailable) {
      return false;
    }

    return this.canAffordResource(id, multiplier);
  }

  public canAffordResource(id: number, multiplier = 1): boolean {
    const resource = this.getResource(id);

    for (const resourceConsume of resource.resourceConsumes) {
      if (this.getResource(resourceConsume.resourceId).amount < resourceConsume.cost * multiplier) {
        return false;
      }
    }

    return true;
  }

  public resourcesOfType(resourceType: ResourceType,
      filterByWorkable: boolean, filterBySellable: boolean, filterByAccessible: boolean): Resource[] {
    let resources = this.resources.filter(resource => resource.resourceType === resourceType);

    if (filterByWorkable) {
      resources = resources.filter(resource => resource.worker.workable);
    }
    if (filterBySellable) {
      resources = resources.filter(resource => resource.sellable);
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
    const resource = this.getResource(id);

    resource.amount += amount;
    if (resource.amount < 0) {
      resource.amount = 0;
    }
  }

  public canAfford(id: number): boolean {
    return (this.getResource(0).amount >= this.getResource(id).worker.cost);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Resources, message);
  }
}
