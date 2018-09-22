import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { ResourceType, ResourceConsume, Resource } from '../../objects/resource';
import { ResourcesService } from '../../services/resources/resources.service';
import { Worker, ResourceWorker } from '../../objects/worker';
import { WorkersService } from '../../services/workers/workers.service';

@Component({
  selector: 'app-resource-dialog',
  templateUrl: './resource-dialog.component.html',
  styleUrls: ['./resource-dialog.component.css']
})
export class ResourceDialogComponent implements OnInit {
  resource: Resource = {
    id: this.resourcesService.resources.length,
    name: '',
    resourceType: ResourceType.Currency,
    amount: 0,
    amountTravelling: 0,
    iconPath: '',
    resourceConsumes: [],
    progressBarValue: 0,
    pathAvailable: false,
    harvestable: true,
    harvesting: false,
    harvestStartDate: Date.now(),
    harvestYield: 1,
    harvestMilliseconds: 1000,
    workerYield: 1,
    sellable: true,
    sellsFor: 5,
    autoSellCutoff: 50,
    resourceDescription: '',
    workerVerb: '',
    workerNoun: '',
    resourceAccessible: true,
    resourceTier: 0,
    previousTier: 0,
    worker: { workable: true, workerCount: 0, cost: 50 },
    resourceBeingStolen: false,
    bindIndex: -1
  };
  resourceWorker: ResourceWorker = this.workersService.getResourceWorker(0);

  editMode = false;

  oldResourceId = 0;

  resourceTypes = ResourceType;

  constructor(public resourcesService: ResourcesService,
              public workersService: WorkersService,
              public _formBuilder: FormBuilder,
              public dialogRef: MatDialogRef<ResourceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {}


  ngOnInit() {
    if (this.data.resourceId !== undefined) {
      this.resource = this.resourcesService.getResource(this.data.resourceId);
      this.resourceWorker = this.workersService.getResourceWorker(this.resource.id);

      this.editMode = true;
    }
  }

  populateResource() {
    const resourceId = +this.oldResourceId;
    const oldResource = this.resourcesService.getResource(resourceId);

    this.resource.name = oldResource.name;
    this.resource.resourceType = oldResource.resourceType;
    this.resource.iconPath = oldResource.iconPath;
    this.resource.amount = oldResource.amount;
    this.resource.harvestable = oldResource.harvestable;
    this.resource.harvestYield = oldResource.harvestYield;
    this.resource.harvestMilliseconds = oldResource.harvestMilliseconds;
    this.resource.workerYield = oldResource.workerYield;
    this.resource.sellable = oldResource.sellable;
    this.resource.sellsFor = oldResource.sellsFor;
    this.resource.resourceDescription = oldResource.resourceDescription;
    this.resource.workerVerb = oldResource.workerVerb;
    this.resource.workerNoun = oldResource.workerNoun;
    this.resource.resourceAccessible = oldResource.resourceAccessible;
    this.resource.resourceTier = oldResource.resourceTier;
    this.resource.previousTier = oldResource.previousTier;

    for (const resourceConsume of oldResource.resourceConsumes) {
      this.resource.resourceConsumes.push({
        resourceId: resourceConsume.resourceId,
        cost: resourceConsume.cost
      });
    }

    this.resource.worker = {
      workable: oldResource.worker.workable,
      workerCount: oldResource.worker.workerCount,
      cost: oldResource.worker.cost
    };

    this.resourceWorker = {
      resourceId: resourceId,
      workable: true,
      recurringCost: 0,
      workerCount: 0,
      workerYield: 1,
      sliderSetting: 0,
      sliderSettingValid: true
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  newResourceConsume() {
    this.resource.resourceConsumes[this.resource.resourceConsumes.length] = {resourceId: 0, cost: 1};
  }

  removeResourceConsume(resourceConsume: ResourceConsume) {
    this.resource.resourceConsumes = this.resource.resourceConsumes.filter(rc => rc !== resourceConsume);
  }

  updateResourceWorker() {
    const worker = this.workersService.getWorker(this.resource.resourceType);

    if (worker === undefined) {
      console.log(`No worker found for ${this.resource.resourceType}`);
      return;
    }

    this.resourceWorker.resourceId = this.resource.id;

    const resourceWorkers = worker.workersByResource;

    if (!resourceWorkers.find(rw => rw === this.resourceWorker)) {
      resourceWorkers.push(this.resourceWorker);
    }
  }

  saveResource() {
    this.updateResourceWorker();

    let existingResource = this.resourcesService.getResource(this.resource.id);

    if (existingResource === undefined) {
      this.resourcesService.resources.push(this.resource);
    } else {
      existingResource = this.resource;
    }
  }

  compareFn(item1: number, item2: number) {
    return +item1 === +item2;
  }
}
