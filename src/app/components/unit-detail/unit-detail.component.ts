import { Component, OnInit } from '@angular/core';

import { MapService } from '../../services/map/map.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { ResourceEnum } from '../../objects/resourceData';
import { Unit } from '../../objects/entity/unit/unit';

@Component({
  selector: 'app-unit-detail',
  templateUrl: './unit-detail.component.html',
  styleUrls: ['./unit-detail.component.css']
})
export class UnitDetailComponent implements OnInit {
  snapSetting = 'lowerLeft';

  constructor(protected mapService: MapService,
              protected buildingsService: BuildingsService,
              protected resourcesService: ResourcesService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.resourcesService.resources.get(resourceEnum);
  }

  removeUnit() {
    if (!this.focusedUnit) {
      return;
    }

    this.focusedUnit.destroy();

    this.focusedTile = undefined;
    this.focusedUnit = undefined;
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.mapService.focusedTile;
  }

  set focusedTile(value: Phaser.Tilemaps.Tile) {
    this.mapService.focusedTile = value;
  }

  get focusedUnit(): Unit {
    return this.mapService.focusedUnit;
  }

  set focusedUnit(value: Unit) {
    this.mapService.focusedUnit = value;
  }
}
