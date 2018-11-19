import { Component, OnInit, } from '@angular/core';

import { HarvestService } from '../../services/harvest/harvest.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceEnum } from '../../objects/resourceData';
import { Resource } from '../../objects/resource';
import { ResourceType } from '../../objects/resourceData';
import { WorkersService } from '../../services/workers/workers.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { MapService } from '../../services/map/map.service';
import { EnemyService } from '../../services/enemy/enemy.service';
import { AdminService } from '../../services/admin/admin.service';
import { TickService } from '../../services/tick/tick.service';

@Component({
  selector: 'app-harvest',
  templateUrl: './harvest.component.html',
  styleUrls: ['./harvest.component.css']
})
export class HarvestComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(protected harvestService: HarvestService,
              protected settingsService: SettingsService,
              protected resourcesService: ResourcesService,
              protected workersService: WorkersService,
              protected tooltipService: TooltipService,
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected adminService: AdminService,
              protected tickService: TickService) { }

  ngOnInit() {
  }

  getResources(resourceType: ResourceType, resourceTiers?: number[], filterByAccessible = true): Resource[] {
    return this.resourcesService.getResources(this.resourceTypes[resourceType], resourceTiers, false, filterByAccessible);
  }

  public getTooltipMessage(resource: Resource): string {
    return this.tooltipService.getResourceTooltip(resource);
  }

  canHarvest(resource: Resource, multiplier: number): boolean {
    return !resource.harvesting && resource.canHarvest(multiplier);
  }

  startHarvesting(resource: Resource) {
    this.harvestService.startHarvesting(resource);
  }

  resourceIsBeingStolen(resource: Resource): boolean {
    return this.enemyService.resourceIsBeingStolen(resource);
  }

  harvestResource(resource: Resource) {
    this.harvestService.harvestResource(resource);
  }

  get goldResource(): Resource {
    return this.resourcesService.resources.get(ResourceEnum.Gold);
  }

  get tiers(): number[] {
    return this.resourcesService.tiers;
  }

  get organizeLeftPanelByType(): boolean {
    return this.settingsService.organizeLeftPanelByType;
  }
}
