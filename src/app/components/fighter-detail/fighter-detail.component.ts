import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Resource } from '../../objects/resource';
import { Tile } from '../../objects/tile';
import { Fighter } from './../../objects/entity';

@Component({
  selector: 'app-fighter-detail',
  templateUrl: './fighter-detail.component.html',
  styleUrls: ['./fighter-detail.component.css']
})
export class FighterDetailComponent implements OnInit {
  snapSetting = 'free';

  constructor(protected mapService: MapService,
              protected buildingsService: BuildingsService,
              protected resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  removeFighter() {
    if (!this.focusedFighter) {
      return;
    }

    this.focusedFighter.health = 0;

    this.focusedTile = undefined;
    this.focusedFighter = undefined;
  }

  getResource(resourceId: number): Resource {
    return this.resourcesService.getResource(resourceId);
  }

  get focusedTile(): Tile {
    return this.mapService.focusedTile;
  }

  set focusedTile(value: Tile) {
    this.mapService.focusedTile = value;
  }

  get focusedFighter(): Fighter {
    return this.mapService.focusedFighter;
  }

  set focusedFighter(value: Fighter) {
    this.mapService.focusedFighter = value;
  }
}