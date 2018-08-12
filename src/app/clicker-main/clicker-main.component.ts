import { Component, OnInit, } from '@angular/core';

import { timer } from 'rxjs';

import { Resource, ResourceType } from '../resource';
import { ResourcesService } from '../resources.service';
import { Worker } from '../worker';
import { WorkersService } from '../workers.service';
import { Tooltip } from '../tooltip';

@Component({
  selector: 'app-clicker-main',
  templateUrl: './clicker-main.component.html',
  styleUrls: ['./clicker-main.component.css']
})
export class ClickerMainComponent implements OnInit {
  harvestTimer;
  harvestSubscribe;
  progressBarTimer;
  progressBarSubscribe;
  
  resourceBeingHarvested: number = -1;
  
  color='primary';
  value=50;
  mode='determinate';
  
  millisecondsElapsed: number = 0;
  progressBarUpdateDelay = 100;

  resourceTypes = ResourceType;
  
  constructor(private resourcesService: ResourcesService,
              private workersService: WorkersService) { }

  ngOnInit() {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.workersService.processWorkers());
  }

  resourcesOfType(resourceType: string): Resource[] {
    return this.resourcesService.resourcesOfType(this.resourceTypes[resourceType]);
  }
  
  public getTooltip(id: number): Tooltip {
    const resource = this.resourcesService.resources[id];
    
    const harvestPerSecond = resource.harvestYield / resource.harvestMilliseconds * 1000;
    const workerYield = resource.workerYield * this.workersService.workers[id].workerCount;
    
    const resourceTooltips: Tooltip[] = [
      { elementId: 0, tooltipMessage: 'Shiny and valuable.' },
      { elementId: 1, tooltipMessage: `Strong oak logs. ${harvestPerSecond} harvested per second; ${workerYield} per second produced by workers.` },
      { elementId: 2, tooltipMessage: `Can be forged into bronze along with tin. ${workerYield} per second produced by workers.` },
      { elementId: 3, tooltipMessage: `Can be forged into bronze along with copper. ${workerYield} per second produced by workers.` },
      { elementId: 4, tooltipMessage: `Somewhat brittle ingots. ${workerYield} per second produced by workers.` },
      { elementId: 5, tooltipMessage: `Unrefined extracts of iron. ${workerYield} per second produced by workers.` },
      { elementId: 6, tooltipMessage: `Dim but sturdy ingots. ${workerYield} per second produced by workers.` }
    ];

    return resourceTooltips[id];
  }
  
  startHarvesting(id: number) {
    const resource = this.resourcesService.resources[id];
    
    if (!this.resourcesService.canHarvest(id))
      return;
    
    this.harvestTimer = timer(resource.harvestMilliseconds, resource.harvestMilliseconds);
    this.harvestSubscribe = this.harvestTimer.subscribe(_ => this.harvestResource(id));
    
    if (this.shouldAnimateProgressBar(id)) {
      this.mode = 'determinate';
      this.progressBarTimer = timer(this.progressBarUpdateDelay, this.progressBarUpdateDelay);
      this.progressBarSubscribe = this.progressBarTimer.subscribe(_ => this.updateProgressBar(id));
    }
    else {
      this.mode='indeterminate';
      this.value = 100;
    }
    
    this.resourceBeingHarvested = id;
  }
  
  stopHarvesting(id: number) {
    if (this.resourceBeingHarvested === -1)
      return;
    
    if (this.shouldAnimateProgressBar(id)) {
      this.progressBarSubscribe.unsubscribe();
    }
    
    this.harvestSubscribe.unsubscribe();
    
    this.resourceBeingHarvested = -1;
    this.millisecondsElapsed = 0;
  }
  
  updateProgressBar(id: number) {
    this.millisecondsElapsed += this.progressBarUpdateDelay;
    
    this.value = this.millisecondsElapsed / this.resourcesService.resources[id].harvestMilliseconds * 100;
  }
  
  shouldAnimateProgressBar(id: number): boolean {
    return this.resourcesService.resources[id].harvestMilliseconds > this.progressBarUpdateDelay;
  }
  
  harvestResource(id: number) {
    this.resourcesService.harvestResource(id);
    this.millisecondsElapsed = 0;
    
    if (this.shouldAnimateProgressBar(id)) {
      this.value = 0;
    }

    if (!this.resourcesService.canHarvest(id))
      this.stopHarvesting(id);
  }
}
