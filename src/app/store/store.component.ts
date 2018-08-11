import { Component, OnInit } from '@angular/core';

import { Resource } from '../resource';
import { ResourcesService } from '../resources.service';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {

  constructor(private resourcesService: ResourcesService,
              private storeService: StoreService) { }

  ngOnInit() {
  }

  sellResource(id: number, amount: number) {
    var resource = this.resourcesService.resources[id];
    
    this.storeService.sellResource(id, amount);
  }
}
