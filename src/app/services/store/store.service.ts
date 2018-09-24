import { Injectable } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourceEnum } from './../../objects/resourceData';
import { MessageSource } from '../../objects/message';
import { ResourcesService } from '../resources/resources.service';
import { MessagesService } from '../messages/messages.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  constructor(private resourcesService: ResourcesService,
              private messagesService: MessagesService) { }

  public sellResource(resource: Resource, amount: number) {
    if (!this.canSellResource(resource, amount)) {
      return;
    }

    if (amount === -1) {
      amount = resource.amount;
    }

    resource.addAmount(-amount);
    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(amount * resource.sellsFor);
  }

  public canSellResource(resource: Resource, amount: number): boolean {
    if (amount === -1) {
      return resource.sellable && resource.amount > 0;
    }

    return resource.sellable && resource.amount - amount >= 0;
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Store, message);
  }
}
