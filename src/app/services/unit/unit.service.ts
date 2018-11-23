import { Injectable } from '@angular/core';
import { Unit, UnitType } from '../../objects/entity/unit/unit';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';
import { EnemyService } from '../enemy/enemy.service';
import { ResourcesService } from '../resources/resources.service';


declare var require: any;
const baseUnitData = require('../../../assets/json/units.json');

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  public unitsData: {} = baseUnitData;
  unitGroup: Phaser.GameObjects.Group;
  public selectedUnitType: UnitType;

  constructor(protected resourcesService: ResourcesService,
              protected enemyService: EnemyService) {
  }

  canAffordUnit(unitType: UnitType) {
    const goldResource: Resource = this.resourcesService.resources.get(ResourceEnum.Gold);
    const unitData = this.unitsData[unitType];

    return goldResource.amount >= unitData.cost;
  }

  purchaseUnit(unitType: UnitType) {
    const unitData = this.unitsData[unitType];

    if (!this.canAffordUnit(unitType)) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-unitData.cost);
  }

  get units(): Unit[] {
    return this.unitGroup.getChildren().map(unit => unit as Unit);
  }
}
