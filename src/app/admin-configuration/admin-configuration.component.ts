import { Component, OnInit } from '@angular/core';

import { ResourcesService } from 'src/app/resources.service';
import { ResourceType } from 'src/app/resource';
import { WorkersService } from 'src/app/workers.service';

@Component({
  selector: 'app-admin-configuration',
  templateUrl: './admin-configuration.component.html',
  styleUrls: ['./admin-configuration.component.css']
})
export class AdminConfigurationComponent implements OnInit {
  resourceTypes = ResourceType;
  resourceId = 0;
  resource = this.resourcesService.resources[this.resourceId];

  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService) { }

  ngOnInit() {
  }

  newResource() {
    this.resourceId = this.resourcesService.resources.length;
    this.resource = {id: this.resourceId, name: '', resourceType: ResourceType.Currency, amount: 0,
    resourceConsumes: [], harvestable: true, harvestYield: 1, harvestMilliseconds: 1000, workerYield: 1, sellable: true,
    sellsFor: 5, resourceDescription: '', workerVerb: '', workerNoun: ''};

    this.resourcesService.resources[this.resourceId] = this.resource;

    this.workersService.workers[this.resourceId] = {id: this.resourceId, workable: true,
      resourceId: this.resourceId, workerCount: 0, cost: 15};
  }

  previousResourceExists(): boolean {
    return this.resourceId > 0;
  }

  nextResourceExists(): boolean {
    return this.resourceId + 1 < this.resourcesService.resources.length;
  }

  previousResource() {
    if (!this.previousResourceExists()) {
      return;
    }

    this.resourceId--;
    this.resource = this.resourcesService.resources[this.resourceId];
  }

  nextResource() {
    if (!this.nextResourceExists()) {
      return;
    }

    this.resourceId++;
    this.resource = this.resourcesService.resources[this.resourceId];
  }

  stringifyResource() {
    alert(JSON.stringify(this.resource));
  }

  stringifyResources() {
    alert(JSON.stringify(this.resourcesService.resources));
  }

  stringifyWorkers() {
    alert(JSON.stringify(this.workersService.workers));
  }
}
