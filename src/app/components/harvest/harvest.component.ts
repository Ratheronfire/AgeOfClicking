import { GameService } from './../../game/game.service';
import { Component, OnInit, } from '@angular/core';

import { ResourceEnum } from '../../objects/resourceData';
import { Resource } from '../../objects/resource';
import { ResourceType } from '../../objects/resourceData';

@Component({
  selector: 'app-harvest',
  templateUrl: './harvest.component.html',
  styleUrls: ['./harvest.component.css']
})
export class HarvestComponent implements OnInit {
  resourceTypes = ResourceType;

  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getResources(resourceType: ResourceType, resourceTiers?: number[], filterByAccessible = true): Resource[] {
    return this.game.resources.getResources(this.resourceTypes[resourceType], resourceTiers, false, filterByAccessible);
  }

  public getTooltipMessage(resource: Resource): string {
    if (!resource) {
      return '';
    }

    return this.game.tooltip.getResourceTooltip(resource);
  }

  canHarvest(resource: Resource, multiplier: number): boolean {
    return !resource.harvesting && resource.canHarvest(multiplier);
  }

  startHarvesting(resource: Resource) {
    this.game.harvest.startHarvesting(resource);
  }

  resourceIsBeingStolen(resource: Resource): boolean {
    return this.game.enemy.resourceIsBeingStolen(resource);
  }

  harvestResource(resource: Resource) {
    this.game.harvest.harvestResource(resource);
  }

  get goldResource(): Resource {
    return this.game.resources.getResource(ResourceEnum.Gold);
  }

  get tiers(): number[] {
    return this.game.resources.tiers;
  }

  get organizeLeftPanelByType(): boolean {
    return this.game.settings.organizeLeftPanelByType;
  }
}
