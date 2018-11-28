import { GameService } from './../../game/game.service';
import { Component, OnInit } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourceType } from '../../objects/resourceData';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  resourceTypes = ResourceType;
  sellableTypes = [ResourceType.Wood, ResourceType.Mineral, ResourceType.Metal];
  sellAmount = 1;

  constructor(protected game: GameService) {
  }

  ngOnInit() {
  }

  canSellResource(resource: Resource) {
    return this.game.store.canSellResource(resource, +this.sellAmount);
  }

  getResources(resourceType: ResourceType, filterBySellable: boolean, filterByAccessible): Resource[] {
    return this.game.resources.getResources(resourceType, undefined, filterBySellable, filterByAccessible);
  }

  sellResource(resource: Resource) {
    this.game.store.sellResource(resource, +this.sellAmount);
  }
}
