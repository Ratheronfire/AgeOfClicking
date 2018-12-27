import { Component, OnInit } from '@angular/core';
import { CursorTool } from 'src/app/game/map.manager';
import { Unit, UnitType } from 'src/app/objects/entity/unit/unit';
import { ResourceEnum } from 'src/app/objects/resourceData';
import { GameService } from './../../game/game.service';

@Component({
  selector: 'app-units',
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.css']
})
export class UnitsComponent implements OnInit {
  unitTypes = UnitType;

  constructor(public game: GameService) { }

  ngOnInit() {
  }

  setFocusedUnit(unit: Unit) {
    this.game.map.cursorTool = CursorTool.UnitDetail;
    this.game.map.focusedUnit = unit;

    this.game.map.mainCamera.centerOn(unit.x, unit.y);

    if (this.game.map.followingUnit) {
      this.game.map.mainCamera.stopFollow();
      this.game.map.mainCamera.startFollow(this.game.map.focusedUnit);
    }
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.game.resources.getResource(resourceEnum);
  }

  getUnits(unitType?: UnitType): Unit[] {
    return this.game.unit.getUnits(unitType);
  }

  get focusedUnit(): Unit {
    return this.game.map.focusedUnit;
  }
}
