import { Component, OnInit } from '@angular/core';

import { timer } from 'rxjs';

import { Worker } from '../worker';
import { WorkersService } from '../workers.service';
import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(private workersService: WorkersService,
              private resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  workersOfType(resourceType: string, filterByWorkable: boolean, filterByAccessible: boolean): Worker[] {
    return this.workersService.workersByType(this.resourceTypes[resourceType], filterByWorkable, filterByAccessible);
  }

  canAfford(id: number): boolean {
    return this.workersService.canAfford(id);
  }

  getTooltipMessage(id: number): string {
    return this.workersService.workerTooltip(id);
  }

  hireWorker(id: number) {
    this.workersService.hireWorker(id);
  }
}
