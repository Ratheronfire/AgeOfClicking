
import { Component, OnInit } from '@angular/core';

import { Resource, ResourceType, ResourceConsume } from './../resource';
import { ResourcesService } from 'src/app/resources.service';

@Component({
  selector: 'app-admin-resource-configuration',
  templateUrl: './admin-resource-configuration.component.html',
  styleUrls: ['./admin-resource-configuration.component.css']
})
export class AdminResourceConfigurationComponent implements OnInit {
  resourceTypes = ResourceType;
  resourceIndex = 0;
  resource = this.resourcesService.resources[this.resourceIndex];

  constructor(private resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  newResource() {
    this.resourceIndex = this.resourcesService.resources.length;
    this.resource = {id: this.resourceIndex, name: '', resourceType: ResourceType.Currency, amount: 0,
    resourceConsumes: [], harvestable: true, harvestYield: 1, harvestMilliseconds: 1000, workerYield: 1, sellable: true,
    sellsFor: 5, resourceDescription: '', workerVerb: '', workerNoun: '', resourceAccessible: true, resourceTier: 0,
    previousTier: 0, worker: {workable: true, workerCount: 0, cost: 50}};

    this.resourcesService.resources[this.resourceIndex] = this.resource;
  }

  newResourceConsume() {
    this.resource.resourceConsumes[this.resource.resourceConsumes.length] = {resourceId: 0, cost: 1};
  }

  removeResourceConsume(resourceConsume: ResourceConsume) {
    this.resource.resourceConsumes = this.resource.resourceConsumes.filter(rc => rc !== resourceConsume);
  }

  removeResource() {
    this.resourcesService.resources = this.resourcesService.resources.filter(resource => resource.id !== this.resourceIndex);
  }

  previousResourceExists(): boolean {
    return this.resourceIndex > 0;
  }

  nextResourceExists(): boolean {
    return this.resourceIndex + 1 < this.resourcesService.resources.length;
  }

  previousResource() {
    if (!this.previousResourceExists()) {
      return;
    }

    this.resourceIndex--;
    this.resource = this.resourcesService.resources[this.resourceIndex];
  }

  nextResource() {
    if (!this.nextResourceExists()) {
      return;
    }

    this.resourceIndex++;
    this.resource = this.resourcesService.resources[this.resourceIndex];
  }

  prepareResourceForJson(resource: Resource) {
    resource.id = +resource.id;

    resource.amount = +resource.amount;

    for (const resourceConsume of resource.resourceConsumes) {
      resourceConsume.resourceId = +resourceConsume.resourceId;
      resourceConsume.cost = +resourceConsume.cost;
    }

    resource.harvestYield = +resource.harvestYield;
    resource.harvestMilliseconds = +resource.harvestMilliseconds;

    resource.workerYield = +resource.workerYield;
    resource.sellsFor = +resource.sellsFor;

    resource.resourceTier = +resource.resourceTier;
    resource.previousTier = +resource.previousTier;

    resource.worker.workerCount = +resource.worker.workerCount;
    resource.worker.cost = +resource.worker.cost;

    resource.amount = 0;
    resource.resourceAccessible = resource.resourceTier === 0;
  }

  stringifyResource() {
    this.prepareResourceForJson(this.resource);
    console.log(this.resource.resourceTier);

    alert(JSON.stringify(this.resource));
  }

  stringifyResources() {
    for (const resource of this.resourcesService.resources) {
      this.prepareResourceForJson(resource);
    }

    alert(JSON.stringify(this.resourcesService.resources));
  }
}
