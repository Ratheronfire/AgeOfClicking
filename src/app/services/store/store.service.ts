import { Injectable } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
import { ResourcesService } from '../resources/resources.service';
import { MessagesService } from '../messages/messages.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private resourcesService: ResourcesService,
              private messagesService: MessagesService) { }

  public sellResource(id: number, amount: number) {
    if (!this.canSellResource(id, amount)) {
      return;
    }

    const resource = this.resourcesService.getResource(id);

    if (amount === -1) {
      amount = resource.amount;
    }

    this.resourcesService.addResourceAmount(resource.id, -amount);
    this.resourcesService.addResourceAmount(0, amount * resource.sellsFor);
  }

  public canSellResource(id: number, amount: number): boolean {
    const resource = this.resourcesService.getResource(id);

    if (amount === -1) {
      return resource.sellable && resource.amount > 0;
    }

    return resource.sellable && resource.amount - amount >= 0;
  }

  public resourcesOfType(resourceType: ResourceType, filterBySellable: boolean, filterByAccessible: boolean) {
    let resources = this.resourcesService.resources.filter(resource => resource.resourceType === resourceType);

    if (filterBySellable) {
      resources = resources.filter(resource => resource.sellable);
    }
    if (filterByAccessible) {
      resources = resources.filter(resource => resource.resourceAccessible);
    }

    return resources;
  }

  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
