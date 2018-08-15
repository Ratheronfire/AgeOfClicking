import { Injectable } from '@angular/core';

import { Resource, ResourceType } from './resource';
import { MessagesService } from './messages.service';

import * as baseResources from '../assets/json/resources.json';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources.default;

  constructor(private messagesService: MessagesService) { }

  public getResource(id: number): Resource {
    return this.resources.find(resource => resource.id === id);
  }

  public harvestResource(id: number) {
    const resource = this.getResource(id);

    if (!resource.harvestable || !this.canHarvest(id)) {
      return;
    }

    for (const resourceConsume of resource.resourceConsumes) {
      this.getResource(resourceConsume.resourceId).amount -= resourceConsume.cost;
    }

    this.resources.filter(r => r.previousTier === resource.resourceTier && r.resourceType === resource.resourceType)
      .map(r => r.resourceAccessible = true);

    resource.amount += resource.harvestYield;
  }

  public canHarvest(id: number): boolean {
    const resource = this.getResource(id);

    if (!resource.harvestable) {
      return false;
    }

    for (const resourceConsume of resource.resourceConsumes) {
      if (this.getResource(resourceConsume.resourceId).amount < resourceConsume.cost) {
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

  public processWorkers() {
    for (const resource of this.resources) {
      if (resource.worker.workerCount <= 0) {
        continue;
      }

      resource.amount += resource.workerYield * resource.worker.workerCount;
    }
  }

  public hireWorker(id: number) {
    if (!this.canAfford(id)) {
      return;
    }

    const worker = this.getResource(id).worker;

    this.getResource(0).amount -= worker.cost;
    worker.cost *= 1.01;
    worker.workerCount++;
  }

  public canAfford(id: number): boolean {
    return (this.getResource(0).amount >= this.getResource(id).worker.cost);
  }

  public workerTooltip(id: number): string {
    const resource = this.getResource(id);

    return `${resource.workerVerb} ${resource.workerYield} ${resource.workerNoun}${resource.workerYield === 1 ? '' : 's'} per second.`;
  }

  public workables(): Resource[] {
    return this.resources.filter(resource => resource.worker.workable);
  }

  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
