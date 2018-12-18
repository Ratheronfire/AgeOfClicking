import { GameService } from './game.service';
import { UnitType, Unit } from '../objects/entity/unit/unit';
import { Resource } from '../objects/resource';
import { ResourceEnum } from '../objects/resourceData';

declare var require: any;
const baseUnitData = require('../../assets/json/units.json');

export class UnitManager {
  public unitsData: {} = baseUnitData;
  unitGroup: Phaser.GameObjects.Group;
  public selectedUnitType: UnitType;

  priceScaleExponent = 5;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  getUnitCost(unitType: UnitType): number {
    const unitsSpawned = this.getUnits(unitType).length;
    const baseCost = this.unitsData[unitType].cost;

    if (!unitsSpawned) {
      return 0;
    }

    return baseCost + Math.pow(unitsSpawned, this.priceScaleExponent);
  }

  canAffordUnit(unitType: UnitType) {
    const goldResource: Resource = this.game.resources.getResource(ResourceEnum.Gold);
    const unitData = this.unitsData[unitType];

    return goldResource.amount >= this.getUnitCost(unitType);
  }

  purchaseUnit(unitType: UnitType) {
    if (!this.canAffordUnit(unitType)) {
      return;
    }

    const cost = this.getUnitCost(unitType)
    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-cost);
  }

  getUnits(unitType?: UnitType): Unit[] {
    let units = this.unitGroup ? this.unitGroup.getChildren().map(unit => unit as Unit) : [];

    if (unitType) {
      units = units.filter(unit => unit.unitType === unitType);
    }

    return units;
  }
}
