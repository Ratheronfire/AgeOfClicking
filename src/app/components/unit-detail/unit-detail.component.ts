import { GameService } from './../../game/game.service';
import { Component, OnInit } from '@angular/core';

import { ResourceEnum } from '../../objects/resourceData';
import { Unit } from '../../objects/entity/unit/unit';

@Component({
  selector: 'app-unit-detail',
  templateUrl: './unit-detail.component.html',
  styleUrls: ['./unit-detail.component.css']
})
export class UnitDetailComponent implements OnInit {
  snapSetting = 'lowerLeft';

  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.game.resources.getResource(resourceEnum);
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
    return this.game.map.focusedTile;
  }

  set focusedTile(value: Phaser.Tilemaps.Tile) {
    this.game.map.focusedTile = value;
  }

  get focusedUnit(): Unit {
    return this.game.map.focusedUnit;
  }

  set focusedUnit(value: Unit) {
    this.game.map.focusedUnit = value;
  }
}
