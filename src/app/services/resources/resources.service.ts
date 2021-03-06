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

      const harvestYield = baseResource.harvestYield ? baseResource.harvestYield : 1;
      const edible = baseResource.edible ? baseResource.edible : false;
      const foodMultiplier = baseResource.foodMultiplier ? baseResource.foodMultiplier : 1;

      const resource = new Resource(baseResource.name, baseResource.resourceType, baseResource.resourceEnum, baseResource. iconPath,
                                    baseResource.resourceConsumes, baseResource.harvestable, harvestYield, baseResource.harvestMilliseconds,
                                    baseResource.sellable, baseResource.sellsFor, baseResource.resourceDescription, baseResource.workerVerb,
                                    baseResource.workerNoun, baseResource.resourceTier, edible, foodMultiplier, this);
      this.resources.set(resourceEnum, resource);
    }
  }

  public getResources(resourceType?: ResourceType, resourceTiers?: number[],
                      filterBySellable = false, filterByAccessible = false,
                      filterByHarvestable = false, filterByEdible = false): Resource[] {
    let resources = Array.from(this.resources.values());

    if (resourceType) {
      resources = resources.filter(resource => resource.resourceType === resourceType);
    }
    if (resourceTiers && resourceTiers.length) {
      resources = resources.filter(resource => resourceTiers.includes(resource.resourceTier));
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
    if (filterByEdible) {
      resources = resources.filter(resource => resource.edible);
    }

    return resources;
  }

  takeFood(maxAmount: number): number {
    const edibleResources = this.getResources(undefined, undefined, false, false, false, true)
      .sort((a, b) => b.foodMultiplier - a.foodMultiplier);
    let totalAmountTaken = 0;
    let currentResource = 0;

    while (totalAmountTaken < maxAmount && currentResource < edibleResources.length &&
        edibleResources.some(resource => resource.amount > 0)) {
      const amountTaken =
        Math.min(maxAmount - totalAmountTaken, edibleResources[currentResource].amount * edibleResources[currentResource].foodMultiplier);

      edibleResources[currentResource].addAmount(-amountTaken / edibleResources[currentResource].foodMultiplier);

      totalAmountTaken += amountTaken;
      currentResource++;
    }

    return totalAmountTaken;
  }

  get totalFoodAmount(): number {
    const edibleResources = this.getResources(undefined, undefined, false, false, false, true);
    return edibleResources.map(resource => resource.amount * resource.foodMultiplier).reduce((total, amount) => total += amount);
  }

  public get playerScore(): number {
    const resources = Array.from(this.resources.values());
    return resources.map(resource => resource.amount * resource.resourceTier).reduce((total, amount) => total += amount);
  }

  public get tiers(): number[] {
    const tiersByResource = this.getResources().map(resource => resource.resourceTier).sort();
    const tiers = [];
    tiersByResource.map(tier => {
      if (!tiers.includes(tier) && this.highestTierReached >= tier - 1) {
        tiers.push(tier);
     }
    });

    return tiers;
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Resources, message);
  }
}
