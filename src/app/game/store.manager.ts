import { MessageSource } from '../objects/message';
import { Resource } from '../objects/resource';
import { ResourceEnum } from '../objects/resourceData';
import { GameService } from './game.service';

export class StoreManager {
  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  public sellResource(resource: Resource, amount: number) {
    if (!this.canSellResource(resource, amount)) {
      return;
    }

    if (amount === -1) {
      amount = resource.amount;
    }

    resource.addAmount(-amount);
    this.game.resources.getResource(ResourceEnum.Gold).addAmount(amount * resource.sellsFor);
  }

  public canSellResource(resource: Resource, amount: number): boolean {
    if (amount === -1) {
      return resource.sellable && resource.amount > 0;
    }

    return resource.sellable && resource.amount - amount >= 0;
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Store, message);
  }
}
