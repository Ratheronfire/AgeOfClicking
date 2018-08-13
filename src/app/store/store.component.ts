import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(private resourcesService: ResourcesService,
              private storeService: StoreService) { }

  ngOnInit() {
  }

  canSellResource(id: number, amount: number) {
    return this.storeService.canSellResource(id, amount);
  }

  resourcesOfType(resourceType: string, filterBySellable: boolean, filterByAccessible): Resource[] {
    return this.storeService.resourcesOfType(this.resourceTypes[resourceType], filterBySellable, filterByAccessible);
  }

  sellResource(id: number, amount: number) {
    const resource = this.resourcesService.resources[id];

    this.storeService.sellResource(id, amount);
  }
}
