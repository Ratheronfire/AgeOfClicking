import { Component, OnInit } from '@angular/core';

import { timer } from 'rxjs';

import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';
import { AdminService } from './../admin.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(private resourcesService: ResourcesService,
              private adminService: AdminService) { }

  ngOnInit() {
  }

  resourcesOfType(resourceType: string, filterByWorkable: boolean, filterByAccessible: boolean): Resource[] {
    return this.resourcesService.resourcesOfType(this.resourceTypes[resourceType], filterByWorkable, filterByAccessible);
  }

  canAfford(id: number): boolean {
    return this.resourcesService.canAfford(id);
  }

  getTooltipMessage(id: number): string {
    return this.resourcesService.workerTooltip(id);
  }

  hireWorker(id: number) {
    this.resourcesService.hireWorker(id);
  }
}
