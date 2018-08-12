import { Injectable } from '@angular/core';

import { Resource, ResourceType } from './resource';
import { ResourcesService } from './resources.service';
import { MessagesService } from './messages.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  
  constructor(private resourcesService: ResourcesService,
              private messagesService: MessagesService) { }
  
  public sellResource(id: number, amount: number) {
    if (!this.canSellResource(id, amount))
      return;

    var resource = this.resourcesService.resources[id];

    if (amount === -1)
      amount = resource.amount;
    
    resource.amount -= amount;
    this.resourcesService.resources[0].amount += amount * resource.sellsFor;
  }

  public canSellResource(id: number, amount: number): boolean {
    var resource = this.resourcesService.resources[id];

    if (amount === -1)
      return resource.sellable && resource.amount > 0;
    
    return resource.sellable && resource.amount - amount >= 0;
  }

  public resourcesOfType(resourceType: ResourceType, filterBySellable: boolean) {
    var resources = this.resourcesService.resources.filter(resource => resource.resourceType === resourceType);
    if (filterBySellable)
      resources = resources.filter(resource => resource.sellable);

    return resources;
  }
  
  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
