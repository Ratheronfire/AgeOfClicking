import { Component, OnInit, } from '@angular/core';

import { ClickerMainService } from './../../services/clicker-main/clicker-main.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceType, Resource } from '../../objects/resource';
import { AdminService } from './../../services/admin/admin.service';

@Component({
  selector: 'app-clicker-main',
  templateUrl: './clicker-main.component.html',
  styleUrls: ['./clicker-main.component.css']
})
export class ClickerMainComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(protected clickerMainService: ClickerMainService,
              protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  resourcesOfType(resourceType: string, filterByAccessible: boolean): Resource[] {
    return this.resourcesService.resourcesOfType(this.resourceTypes[resourceType], false, filterByAccessible);
  }

  public getTooltipMessage(id: number): string {
    const workerCount = this.resourcesService.getResource(id).worker.workerCount;
    return this.resourcesService.resourceTooltip(id, workerCount);
  }

  startHarvesting(id: number) {
    this.clickerMainService.startHarvesting(id);
  }

  stopHarvesting(id: number) {
    this.clickerMainService.stopHarvesting(id);
  }

  updateProgressBar(id: number) {
    this.clickerMainService.updateProgressBar(id);
  }

  shouldAnimateProgressBar(id: number): boolean {
    return this.clickerMainService.shouldAnimateProgressBar(id);
  }

  harvestResource(id: number) {
    this.clickerMainService.harvestResource(id);
  }

  editResource(id: number) {
    this.adminService.openResourceDialog(id);
  }

  get resourceBeingHarvested() {
    return this.clickerMainService.resourceBeingHarvested;
  }

  get value() {
    return this.clickerMainService.value;
  }

  get mode() {
    return this.clickerMainService.mode;
  }

  get millisecondsTotal() {
    return this.clickerMainService.millisecondsTotal;
  }

  get harvestStartDate() {
    return this.clickerMainService.harvestStartDate;
  }

  get progressBarUpdateDelay() {
    return this.clickerMainService.progressBarUpdateDelay;
  }
}
