import { Component, OnInit } from '@angular/core';

import { ResourceEnum } from '../../objects/resourceData';
import { FighterData } from '../../objects/entity';
import { BuildingsService } from './../../services/buildings/buildings.service';
import { FighterService } from '../../services/fighter/fighter.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { MapService } from '../../services/map/map.service';

@Component({
  selector: 'app-fighter',
  templateUrl: './fighter.component.html',
  styleUrls: ['./fighter.component.css']
})
export class FighterComponent implements OnInit {
  constructor(public resourcesService: ResourcesService,
              public settingsService: SettingsService,
              public buildingsService: BuildingsService,
              public fighterService: FighterService,
              public mapService: MapService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.resourcesService.resources.get(resourceEnum);
  }

  canAffordFighter(fighterType: FighterData) {
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= fighterType.cost;
  }

  selectFigherType(fighterType: FighterData) {
    if (this.selectedFighterType === fighterType) {
      this.selectedFighterType = undefined;
    } else {
      this.buildingsService.selectedBuilding = undefined;
      this.selectedFighterType = fighterType;
    }
  }

  get fighterTypes() {
    return this.fighterService.fighterTypes;
  }

  get selectedFighterType(): FighterData {
    return this.fighterService.selectedFighterType;
  }

  set selectedFighterType(value: FighterData) {
    this.fighterService.selectedFighterType = value;
  }
}
