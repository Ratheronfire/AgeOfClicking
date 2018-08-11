import { Injectable } from '@angular/core';

import { Resource } from './resource';
import { ResourcesService } from './resources.service';
import { MessagesService } from './messages.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  
  constructor(private resourcesService: ResourcesService,
              private messagesService: MessagesService) { }
  
  public sellResource(id: number, amount: number) {
    var resource = this.resourcesService.resources[id];
    
    if (!resource.sellable || resource.value - amount < 0)
      return;
    
    if (amount === -1)
      amount = resource.value;
    
    resource.value -= amount;
    this.resourcesService.resources[0].value += amount * resource.sellsFor;
  }
  
  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
