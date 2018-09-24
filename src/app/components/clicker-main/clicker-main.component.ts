import { Component, OnInit, } from '@angular/core';

import { ClickerMainService } from './../../services/clicker-main/clicker-main.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Resource } from '../../objects/resource';
import { ResourceType } from '../../objects/resourceData';
import { WorkersService } from '../../services/workers/workers.service';
import { TooltipService } from './../../services/tooltip/tooltip.service';
import { MapService } from './../../services/map/map.service';
import { EnemyService } from './../../services/enemy/enemy.service';
import { AdminService } from './../../services/admin/admin.service';
import { TickService } from './../../services/tick/tick.service';

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
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected adminService: AdminService,
              protected tickService: TickService) { }

  ngOnInit() {
  }

  getResources(resourceType: ResourceType, filterByAccessible: boolean): Resource[] {
    return this.resourcesService.getResources(this.resourceTypes[resourceType], false, filterByAccessible);
  }

  public getTooltipMessage(resource: Resource): string {
    return this.tooltipService.getResourceTooltip(resource);
  }

  canHarvest(resource: Resource, multiplier: number): boolean {
    return !resource.harvesting && resource.canHarvest(multiplier);
  }

  startHarvesting(resource: Resource) {
    this.clickerMainService.startHarvesting(resource);
  }

  resourceIsBeingStolen(resource: Resource): boolean {
    return this.enemyService.resourceIsBeingStolen(resource);
  }

  harvestResource(resource: Resource) {
    this.clickerMainService.harvestResource(resource);
  }
}
