import { Component, OnInit } from '@angular/core';

import { Resource } from '../../objects/resource';
import { ResourceType } from '../../objects/resourceData';
import { ResourcesService } from '../../services/resources/resources.service';
import { StoreService } from '../../services/store/store.service';
import { AdminService } from '../../services/admin/admin.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  resourceTypes = ResourceType;
  sellableTypes = [ResourceType.Wood, ResourceType.Mineral, ResourceType.Metal];
  sellAmount = 1;

  constructor(private resourcesService: ResourcesService,
              private storeService: StoreService,
              private adminService: AdminService) {
  }

  ngOnInit() {
  }

  canSellResource(resource: Resource) {
    return this.storeService.canSellResource(resource, +this.sellAmount);
  }

  getResources(resourceType: ResourceType, filterBySellable: boolean, filterByAccessible): Resource[] {
    return this.resourcesService.getResources(resourceType, undefined, filterBySellable, filterByAccessible);
  }

  sellResource(resource: Resource) {
    this.storeService.sellResource(resource, +this.sellAmount);
  }
}
