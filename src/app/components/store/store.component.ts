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

  constructor(private resourcesService: ResourcesService,
              private storeService: StoreService,
              private adminService: AdminService) { }

  ngOnInit() {
  }

  canSellResource(id: number, amount: number) {
    return this.storeService.canSellResource(id, amount);
  }

  resourcesOfType(resourceType: string, filterBySellable: boolean, filterByAccessible): Resource[] {
    return this.storeService.resourcesOfType(this.resourceTypes[resourceType], filterBySellable, filterByAccessible);
  }

  sellResource(id: number, amount: number) {
    const resource = this.resourcesService.getResource(id);

    this.storeService.sellResource(id, amount);
  }
}
