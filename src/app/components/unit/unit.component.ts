import { Component, OnInit } from '@angular/core';
import { UnitData } from 'src/app/objects/entity/actor';
import { ResourceEnum } from '../../objects/resourceData';
import { UnitService } from '../../services/unit/unit.service';
import { MapService } from '../../services/map/map.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { SettingsService } from '../../services/settings/settings.service';
import { BuildingsService } from '../../services/buildings/buildings.service';
import { UnitType } from 'src/app/objects/entity/unit/unit';


@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.css']
})
export class UnitComponent implements OnInit {
  UnitTypes = UnitType;

  constructor(public resourcesService: ResourcesService,
              public settingsService: SettingsService,
              public buildingsService: BuildingsService,
              public unitService: UnitService,
              public mapService: MapService) { }

  ngOnInit() {
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.resourcesService.resources.get(resourceEnum);
  }

  canAffordUnit(unitType: UnitType) {
    const unitData = this.unitService.unitsData[unitType];
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= unitData.cost;
  }

  selectUnitType(unitType: UnitType) {
    if (this.selectedUnitType === unitType) {
      this.selectedUnitType = undefined;
    } else {
      this.buildingsService.selectedBuilding = undefined;
      this.selectedUnitType = unitType;
    }
  }

  getUnitData(unitType): UnitData {
    return this.unitService.unitsData[unitType];
  }

  get unitsData() {
    return this.unitService.unitsData;
  }

  get selectedUnitType(): UnitType {
    return this.unitService.selectedUnitType;
  }

  set selectedUnitType(value: UnitType) {
    this.unitService.selectedUnitType = value;
  }
}
