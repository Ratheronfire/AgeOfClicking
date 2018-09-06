import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType } from '../../objects/resource';
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

  canSellResource(id: number) {
    return this.storeService.canSellResource(id, +this.sellAmount);
  }

  resourcesOfType(resourceType: ResourceType, filterBySellable: boolean, filterByAccessible): Resource[] {
    return this.storeService.resourcesOfType(resourceType, filterBySellable, filterByAccessible);
  }

  sellResource(id: number) {
    const resource = this.resourcesService.getResource(id);

    this.storeService.sellResource(id, +this.sellAmount);
  }
}
