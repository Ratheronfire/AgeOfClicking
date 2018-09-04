import { Component, OnInit } from '@angular/core';

import { Fighter } from '../../objects/entity';
import { FighterService } from '../../services/fighter/fighter.service';
import { ResourcesService } from '../../services/resources/resources.service';

@Component({
  selector: 'app-fighter',
  templateUrl: './fighter.component.html',
  styleUrls: ['./fighter.component.css']
})
export class FighterComponent implements OnInit {
  constructor(protected resourcesService: ResourcesService,
              protected fighterService: FighterService) { }

  ngOnInit() {
  }

  canAffordFighter(fighterType: Fighter) {
    return this.resourcesService.getResource(0).amount >= fighterType.cost;
  }

  selectFigherType(fighterType: Fighter) {
    this.fighterService.selectedFighterType = fighterType;
  }

  get selectedFighterType(): Fighter {
    return this.fighterService.selectedFighterType;
  }

  set selectedFighterType(value: Fighter) {
    this.fighterService.selectedFighterType = value;
  }

  getResource(id: number) {
    return this.resourcesService.getResource(id);
  }

  get fighterTypes() {
    return this.fighterService.fighterTypes;
  }
}
