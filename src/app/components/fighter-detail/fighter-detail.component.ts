import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceEnum } from './../../objects/resourceData';
import { Fighter } from './../../objects/entity';

@Component({
  selector: 'app-fighter-detail',
  templateUrl: './fighter-detail.component.html',
  styleUrls: ['./fighter-detail.component.css']
})
export class FighterDetailComponent implements OnInit {
  snapSetting = 'lowerLeft';

  constructor(protected mapService: MapService,
              protected buildingsService: BuildingsService,
              protected resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.resourcesService.resources.get(resourceEnum);
  }

  removeFighter() {
    if (!this.focusedFighter) {
      return;
    }

    this.focusedFighter.kill();

    this.focusedTile = undefined;
    this.focusedFighter = undefined;
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.mapService.focusedTile;
  }

  set focusedTile(value: Phaser.Tilemaps.Tile) {
    this.mapService.focusedTile = value;
  }

  get focusedFighter(): Fighter {
    return this.mapService.focusedFighter;
  }

  set focusedFighter(value: Fighter) {
    this.mapService.focusedFighter = value;
  }
}
