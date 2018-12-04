import { GameService } from './../../game/game.service';
import { Component, OnInit } from '@angular/core';
import { UnitType, Unit } from 'src/app/objects/entity/unit/unit';
import { CursorTool } from 'src/app/game/map.manager';

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
}
