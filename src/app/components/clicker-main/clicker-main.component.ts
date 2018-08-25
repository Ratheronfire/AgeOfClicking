import { Component, OnInit, } from '@angular/core';

import { ClickerMainService } from './../../services/clicker-main/clicker-main.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceType, Resource } from '../../objects/resource';
import { WorkersService } from '../../services/workers/workers.service';
import { TooltipService } from './../../services/tooltip/tooltip.service';
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
              protected workersService: WorkersService,
              protected tooltipService: TooltipService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

  resourcesOfType(resourceType: string, filterByAccessible: boolean): Resource[] {
    return this.resourcesService.resourcesOfType(this.resourceTypes[resourceType], false, filterByAccessible);
  }

  public getTooltipMessage(id: number): string {
    return this.tooltipService.getResourceTooltip(id);
  }

  startHarvesting(id: number) {
    this.clickerMainService.startHarvesting(id);
  }

  stopHarvesting(id: number) {
    this.clickerMainService.stopHarvesting(id);
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
}