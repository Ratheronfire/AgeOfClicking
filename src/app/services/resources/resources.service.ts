import { Injectable, OnInit } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourceType, ResourceEnum } from './../../objects/resourceData';
import { MessageSource } from '../../objects/message';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseResources = require('../../../assets/json/resources.json');

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources = new Map<string, Resource>();
  highestTierReached = 0;

  constructor(protected messagesService: MessagesService) {
    this.loadBaseResources();
  }

  public loadBaseResources() {
    this.resources.clear();
    for (const resourceName in ResourceEnum) {
      if (Number(resourceName)) {
        continue;
      }

      const resourceEnum = ResourceEnum[resourceName];

      const baseResource = baseResources[resourceEnum];
      const resource = new Resource(baseResource.name, baseResource.resourceType, baseResource.resourceEnum, baseResource. iconPath,
                                    baseResource.resourceConsumes, baseResource.harvestable, baseResource.harvestMilliseconds,
                                    baseResource.sellable, baseResource.sellsFor, baseResource.resourceDescription, baseResource.workerVerb,
                                    baseResource.workerNoun, baseResource.resourceTier, this);
      this.resources.set(resourceEnum, resource);
    }
  }

  public getResources(resourceType?: ResourceType,
                      filterBySellable = false, filterByAccessible = false, filterByHarvestable = false): Resource[] {
    let resources = Array.from(this.resources.values());

    if (resourceType) {
      resources = resources.filter(resource => resource.resourceType === resourceType);
    }
    if (filterBySellable) {
      resources = resources.filter(resource => resource.sellable);
    }
    if (filterByAccessible) {
      resources = resources.filter(resource => resource.resourceAccessible);
    }
    if (filterByHarvestable) {
      resources = resources.filter(resource => resource.harvestable);
    }

    return resources;
  }

  public getPlayerScore(): number {
    const resources = Array.from(this.resources.values());
    return resources.map(resource => resource.amount * resource.resourceTier).reduce((total, amount) => total += amount);
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Resources, message);
  }
}
