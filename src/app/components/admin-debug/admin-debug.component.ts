import { Component, OnInit } from '@angular/core';

import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Resource } from '../../objects/resource';
import { Worker } from '../../objects/worker';
import { WorkersService } from '../../services/workers/workers.service';
import { UpgradesService } from '../../services/upgrades/upgrades.service';

@Component({
  selector: 'app-admin-debug',
  templateUrl: './admin-debug.component.html',
  styleUrls: ['./admin-debug.component.css']
})
export class AdminDebugComponent implements OnInit {
  public filterAccessible = true;

  protected selectedResource: Resource;
  amount: number;

  constructor(
    protected resourcesService: ResourcesService,
    protected workersService: WorkersService,
    protected upgradesService: UpgradesService,
    protected adminService: AdminService
  ) {}

  ngOnInit() {}

  openResourceDialog() {
    this.adminService.openResourceDialog();
  }

  openUpgradeDialog() {
    this.adminService.openUpgradeDialog();
  }

  addResourceAmount() {
    this.resourcesService.addResourceAmount(
      +this.selectedResource.id,
      +this.amount
    );
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
    resource.previousTier = resource.resourceTier === 0 ? 0 : resource.resourceTier - 1;
    resource.resourceAccessible = resource.resourceTier === 0;

    resource.worker.workerCount = +resource.worker.workerCount;
    resource.worker.cost = +resource.worker.cost;

    resource.amount = 0;
    resource.resourceAccessible = resource.resourceTier === 0;
  }

  prepareWorkerForJson(worker: Worker) {
    worker.id = +worker.id;

    worker.cost = +worker.cost;

    for (const resourceWorker of worker.workersByResource) {
      resourceWorker.resourceId = +resourceWorker.resourceId;

      resourceWorker.workerCount = +resourceWorker.workerCount;
      resourceWorker.workerYield = +resourceWorker.workerYield;
    }

    worker.workerCount = 0;
    worker.freeWorkers = 0;
  }

  stringifyResource(resource: Resource) {
    this.prepareResourceForJson(resource);

    alert(JSON.stringify(resource));
  }

  stringifyResources() {
    for (const resource of this.resourcesService.resources) {
      this.prepareResourceForJson(resource);
    }

    alert(JSON.stringify(this.resourcesService.resources));
  }

  stringifyWorkers() {
    for (const worker of this.workersService.workers) {
      this.prepareWorkerForJson(worker);
    }

    alert(JSON.stringify(this.workersService.workers));
  }

  stringifyUpgrades() {
    alert(JSON.stringify(this.upgradesService.upgrades));
  }
}
