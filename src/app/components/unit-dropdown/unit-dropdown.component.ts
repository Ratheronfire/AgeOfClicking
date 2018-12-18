import { Component, OnInit } from '@angular/core';
import { UnitData } from 'src/app/objects/entity/actor';
import { UnitType } from 'src/app/objects/entity/unit/unit';
import { ResourceEnum } from '../../objects/resourceData';
import { GameService } from '../../game/game.service';


@Component({
  selector: 'app-unit-dropdown',
  templateUrl: './unit-dropdown.component.html',
  styleUrls: ['./unit-dropdown.component.css']
})
export class UnitDropdownComponent implements OnInit {
  UnitTypes = UnitType;

  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.game.resources.getResource(resourceEnum);
  }

  canAffordUnit(unitType: UnitType) {
    return this.game.unit.canAffordUnit(unitType);
  }

  selectUnitType(unitType: UnitType) {
    if (this.selectedUnitType === unitType) {
      this.selectedUnitType = undefined;
    } else {
      this.game.buildings.selectedBuilding = undefined;
      this.selectedUnitType = unitType;
    }
  }

  getUnitData(unitType: UnitType): UnitData {
    return this.game.unit.unitsData[unitType];
  }

  getUnitCost(unitType: UnitType): number {
    return this.game.unit.getUnitCost(unitType);
  }

  get unitsData() {
    return this.game.unit.unitsData;
  }

  get selectedUnitType(): UnitType {
    return this.game.unit.selectedUnitType;
  }

  set selectedUnitType(value: UnitType) {
    this.game.unit.selectedUnitType = value;
  }
}
