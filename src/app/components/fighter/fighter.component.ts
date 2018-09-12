import { Component, OnInit } from '@angular/core';

import { Fighter } from '../../objects/entity';
import { BuildingsService } from './../../services/buildings/buildings.service';
import { FighterService } from '../../services/fighter/fighter.service';
import { SettingsService } from '../../services/settings/settings.service';
import { ResourcesService } from '../../services/resources/resources.service';

@Component({
  selector: 'app-fighter',
  templateUrl: './fighter.component.html',
  styleUrls: ['./fighter.component.css']
})
export class FighterComponent implements OnInit {
  constructor(protected resourcesService: ResourcesService,
              protected settingsService: SettingsService,
              protected buildingsService: BuildingsService,
              protected fighterService: FighterService) { }

  ngOnInit() {
  }

  canAffordFighter(fighterType: Fighter) {
    return this.resourcesService.getResource(0).amount >= fighterType.cost;
  }

  selectFigherType(fighterType: Fighter) {
    if (this.selectedFighterType === fighterType) {
      this.selectedFighterType = undefined;
    } else {
      this.buildingsService.selectedBuilding = undefined;
      this.selectedFighterType = fighterType;
    }
  }

  getResource(id: number) {
    return this.resourcesService.getResource(id);
  }

  get fighterTypes() {
    return this.fighterService.fighterTypes;
  }

  get selectedFighterType(): Fighter {
    return this.fighterService.selectedFighterType;
  }

  set selectedFighterType(value) {
    this.fighterService.selectedFighterType = value;
  }
}
